
import React, { useState, useEffect, useCallback } from 'react';
import { AssetSymbol, PositionType, GameState, Position, PlantedTree } from './types';
import { INITIAL_BALANCE, ASSETS, INITIAL_QUESTS, TUTORIAL_STEPS, GROUND_SIZE } from './constants';
import { generateNextPrice, calculatePnL, calculateSustainability } from './services/gameLogic';
import { TradePanel } from './components/TradePanel';
import { Biome } from './components/Biome';
import { QuestBoard } from './components/QuestBoard';
import { Button } from './components/ui/Button';
import { Wallet, Info, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; 

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    balance: INITIAL_BALANCE,
    ecoTokens: 0,
    sustainabilityScore: 100,
    positions: [],
    plantedTrees: [], // Persisted trees
    prices: { ETH: ASSETS.ETH.price, BTC: ASSETS.BTC.price, SOL: ASSETS.SOL.price },
    quests: INITIAL_QUESTS,
    marketHistory: {
      ETH: Array(20).fill({ time: Date.now(), price: ASSETS.ETH.price }),
      BTC: Array(20).fill({ time: Date.now(), price: ASSETS.BTC.price }),
      SOL: Array(20).fill({ time: Date.now(), price: ASSETS.SOL.price }),
    }
  });

  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);

  // --- Game Loop (Simulated Market) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        const newPrices = { ...prev.prices };
        const newHistory = { ...prev.marketHistory };

        // 1. Update Prices
        (Object.keys(newPrices) as AssetSymbol[]).forEach(symbol => {
          const asset = ASSETS[symbol];
          newPrices[symbol] = generateNextPrice(newPrices[symbol], asset.volatility, asset.trend);
          
          // Update History (keep last 50 points)
          newHistory[symbol] = [
            ...newHistory[symbol].slice(-49),
            { time: Date.now(), price: newPrices[symbol] }
          ];
        });

        // 2. Update Positions PnL & Check Liquidations
        const activePositions: Position[] = [];
        let liquidations = false;

        prev.positions.forEach(pos => {
          const { pnl, pnlPercent } = calculatePnL(pos, newPrices[pos.symbol]);
          
          // Liquidation logic: if collateral is gone (-80% PnL is safety buffer in this game)
          if (pnlPercent <= -80) {
            liquidations = true;
            // Position removed, collateral lost
          } else {
            activePositions.push({ ...pos, pnl, pnlPercent });
          }
        });

        // 3. Update Sustainability
        const susScore = calculateSustainability(activePositions, prev.balance);

        // 4. Update Quests (Passive checks)
        const updatedQuests = prev.quests.map(q => {
          if (q.completed) return q;
          
          // "Storm Weatherer" quest progress (checking high leverage survival)
          if (q.id === 'risk_manager') {
             const highLevPos = activePositions.find(p => p.leverage >= 5);
             if (highLevPos) return { ...q, progress: Math.min(q.progress + 1, q.maxProgress) };
          }
          return q;
        }).map(q => {
            // Check completion for passive updates
            if (!q.completed && q.progress >= q.maxProgress) {
                return { ...q, completed: true };
            }
            return q;
        });

        // Collect rewards for newly completed quests
        const newlyCompleted = updatedQuests.filter(q => q.completed && !prev.quests.find(pq => pq.id === q.id)?.completed);
        const reward = newlyCompleted.reduce((sum, q) => sum + q.reward, 0);

        return {
          ...prev,
          prices: newPrices,
          marketHistory: newHistory,
          positions: activePositions,
          sustainabilityScore: susScore,
          quests: updatedQuests,
          ecoTokens: prev.ecoTokens + reward,
          // If liquidated, balance doesn't increase, but positions are gone (collateral lost)
        };
      });
    }, 2000); // 2 second tick for MVP

    return () => clearInterval(interval);
  }, []);

  // --- Actions ---

  const handleTrade = (symbol: AssetSymbol, type: PositionType, amount: number, leverage: number) => {
    const currentPrice = gameState.prices[symbol];
    
    // Generate random coordinates within bounds (accounting for some margin)
    const margin = 4;
    const bound = (GROUND_SIZE / 2) - margin;
    const x = (Math.random() - 0.5) * 2 * bound;
    const z = (Math.random() - 0.5) * 2 * bound;

    const newPosition: Position = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      type,
      entryPrice: currentPrice,
      size: amount * leverage,
      collateral: amount,
      leverage,
      pnl: 0,
      pnlPercent: 0,
      timestamp: Date.now(),
      coordinates: { x, z }
    };

    setGameState(prev => {
        // Quest Check: "Plant a Seed"
        const updatedQuests = prev.quests.map(q => {
            if (q.id === 'first_growth' && type === 'LONG') return { ...q, progress: 1, completed: true };
            if (q.id === 'diversify' && prev.positions.length + 1 >= 2) return { ...q, progress: 2, completed: true };
            return q;
        });

        const newlyCompleted = updatedQuests.filter(q => q.completed && !prev.quests.find(pq => pq.id === q.id)?.completed);
        const reward = newlyCompleted.reduce((sum, q) => sum + q.reward, 0);

        return {
            ...prev,
            balance: prev.balance - amount,
            positions: [...prev.positions, newPosition],
            quests: updatedQuests,
            ecoTokens: prev.ecoTokens + reward
        };
    });
  };

  const closePosition = (id: string) => {
      setGameState(prev => {
          const pos = prev.positions.find(p => p.id === id);
          if (!pos) return prev;

          const returnedCollateral = pos.collateral + pos.pnl;
          
          // Logic for persisting tree if profitable Long
          let newPlantedTrees = [...prev.plantedTrees];
          if (pos.type === 'LONG' && pos.pnl > 0) {
              const scale = Math.min(Math.max(1 + (pos.pnlPercent / 100), 0.5), 2.5);
              newPlantedTrees.push({
                  id: pos.id,
                  x: pos.coordinates.x,
                  z: pos.coordinates.z,
                  scale: scale,
                  date: Date.now()
              });
          }

          // Quest Check: Sustainable Growth
          const updatedQuests = prev.quests.map(q => {
            if (q.id === 'sustainable_trader' && pos.pnlPercent >= 5) return { ...q, progress: 1, completed: true };
            return q;
          });
          const newlyCompleted = updatedQuests.filter(q => q.completed && !prev.quests.find(pq => pq.id === q.id)?.completed);
          const reward = newlyCompleted.reduce((sum, q) => sum + q.reward, 0);

          return {
              ...prev,
              balance: prev.balance + returnedCollateral,
              positions: prev.positions.filter(p => p.id !== id),
              plantedTrees: newPlantedTrees,
              quests: updatedQuests,
              ecoTokens: prev.ecoTokens + reward
          };
      });
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">E</div>
            <h1 className="font-bold text-lg tracking-tight text-white">Eco-Sim Perps</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800">
               <Wallet size={16} className="text-slate-400" />
               <span className="font-mono font-medium">${Math.floor(gameState.balance).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full border border-amber-900/30">
               <span className="font-bold text-amber-500">{gameState.ecoTokens}</span>
               <span className="text-xs text-amber-700 font-bold uppercase tracking-wider">ECO</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
        
        {/* Left Column: Biome (Visualization) */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-[500px]">
          
          {/* Visualization Area */}
          <div className="flex-1 relative">
            <Biome 
                positions={gameState.positions} 
                plantedTrees={gameState.plantedTrees}
                sustainabilityScore={gameState.sustainabilityScore} 
            />
          </div>

          {/* Active Positions List */}
          <div className="h-48 bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/80 text-xs font-bold uppercase text-slate-400 tracking-wider">
              Active Eco-Systems
            </div>
            <div className="overflow-y-auto p-2 space-y-2">
              {gameState.positions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
                  No active positions.
                </div>
              ) : (
                gameState.positions.map(pos => (
                  <div key={pos.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${pos.type === 'LONG' ? 'bg-emerald-900 text-emerald-400' : 'bg-rose-900 text-rose-400'}`}>
                        {pos.type}
                      </span>
                      <div>
                        <div className="font-bold text-white">{pos.symbol} <span className="text-slate-500 text-xs font-normal">x{pos.leverage}</span></div>
                        <div className="text-xs text-slate-400">Entry: ${pos.entryPrice.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-mono font-bold ${pos.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pos.pnlPercent > 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                      </div>
                      <div className="text-xs text-slate-500">${pos.pnl.toFixed(2)}</div>
                    </div>

                    <Button size="sm" variant="secondary" onClick={() => closePosition(pos.id)}>
                      {pos.pnl > 0 && pos.type === 'LONG' ? 'Harvest & Keep Tree' : 'Close'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Trading & Quests */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 min-h-[400px]">
            <TradePanel 
              assets={ASSETS} 
              balance={gameState.balance} 
              onTrade={handleTrade}
              priceHistory={gameState.marketHistory}
            />
          </div>
          <div className="flex-1 min-h-[300px]">
            <QuestBoard quests={gameState.quests} />
          </div>
        </div>
      </main>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Info size={20} className="text-indigo-500" />
                {TUTORIAL_STEPS[tutorialStep].title}
              </h2>
              <button onClick={() => setShowTutorial(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-300 mb-8 leading-relaxed">
              {TUTORIAL_STEPS[tutorialStep].content}
            </p>

            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {TUTORIAL_STEPS.map((_, idx) => (
                  <div key={idx} className={`h-1.5 w-6 rounded-full ${idx === tutorialStep ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                ))}
              </div>
              <Button 
                onClick={() => {
                  if (tutorialStep < TUTORIAL_STEPS.length - 1) {
                    setTutorialStep(s => s + 1);
                  } else {
                    setShowTutorial(false);
                  }
                }}
              >
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? 'Next' : 'Start Trading'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
