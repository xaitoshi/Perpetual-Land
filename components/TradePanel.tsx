import React, { useState, useEffect } from 'react';
import { AssetSymbol, PositionType, Asset } from '../types';
import { Button } from './ui/Button';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface TradePanelProps {
  assets: Record<AssetSymbol, Asset>;
  balance: number;
  onTrade: (symbol: AssetSymbol, type: PositionType, amount: number, leverage: number) => void;
  priceHistory: Record<AssetSymbol, { time: number; price: number }[]>;
}

export const TradePanel: React.FC<TradePanelProps> = ({ assets, balance, onTrade, priceHistory }) => {
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('ETH');
  const [amount, setAmount] = useState<number>(1000);
  const [leverage, setLeverage] = useState<number>(1);
  const [direction, setDirection] = useState<PositionType>('LONG');

  const asset = assets[selectedAsset];
  const maxAmount = balance; // Can use full balance for margin

  const chartData = priceHistory[selectedAsset] || [];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col gap-6 h-full">
      
      {/* Asset Selection */}
      <div className="flex gap-2 p-1 bg-slate-900 rounded-lg">
        {(Object.keys(assets) as AssetSymbol[]).map((symbol) => (
          <button
            key={symbol}
            onClick={() => setSelectedAsset(symbol)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              selectedAsset === symbol 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* Price & Chart */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-end">
          <span className="text-3xl font-bold text-white tracking-tight">
            ${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          <span className={`text-sm font-mono flex items-center gap-1 ${Math.random() > 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <Activity size={14} /> Live
          </span>
        </div>
        <div className="h-24 w-full bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/50">
           <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={['auto', 'auto']} hide />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#6366f1" 
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trade Controls */}
      <div className="space-y-4">
        
        {/* Direction Switch */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setDirection('LONG')}
            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
              direction === 'LONG' 
                ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' 
                : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600'
            }`}
          >
            <TrendingUp size={24} />
            <span className="font-bold">LONG</span>
            <span className="text-xs opacity-75">Plant & Grow</span>
          </button>

          <button
            onClick={() => setDirection('SHORT')}
            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
              direction === 'SHORT' 
                ? 'bg-rose-900/30 border-rose-500/50 text-rose-400' 
                : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600'
            }`}
          >
            <TrendingDown size={24} />
            <span className="font-bold">SHORT</span>
            <span className="text-xs opacity-75">Erode & Profit</span>
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex justify-between">
            <span>Collateral Size</span>
            <span>Max: ${Math.floor(balance)}</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.min(Number(e.target.value), maxAmount))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Leverage Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 uppercase font-bold tracking-wider">
            <span>Leverage</span>
            <span className="text-indigo-400">{leverage}x</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="5" 
            step="1"
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Safe</span>
            <span>Risky</span>
          </div>
        </div>

        {/* Submit */}
        <Button 
          variant={direction === 'LONG' ? 'success' : 'danger'} 
          className="w-full py-4 text-lg shadow-xl"
          onClick={() => onTrade(selectedAsset, direction, amount, leverage)}
          disabled={amount <= 0 || amount > balance}
        >
          {direction === 'LONG' ? 'Plant Position' : 'Build Short'} 
        </Button>
      </div>
    </div>
  );
};