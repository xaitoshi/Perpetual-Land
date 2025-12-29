
export type AssetSymbol = 'ETH' | 'BTC' | 'SOL';

export type PositionType = 'LONG' | 'SHORT';

export interface Asset {
  symbol: AssetSymbol;
  name: string;
  price: number;
  volatility: number; // 0-1, higher is more volatile
  trend: number; // -1 to 1, bias for random movement
}

export interface Position {
  id: string;
  symbol: AssetSymbol;
  type: PositionType;
  entryPrice: number;
  size: number; // In USD
  leverage: number;
  collateral: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
  coordinates: { x: number; z: number };
}

export interface PlantedTree {
  id: string;
  x: number;
  z: number;
  scale: number;
  date: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number; // ECO tokens
  completed: boolean;
  progress: number;
  maxProgress: number;
}

export interface GameState {
  balance: number; // Mock USD
  ecoTokens: number;
  sustainabilityScore: number; // 0-100
  positions: Position[];
  plantedTrees: PlantedTree[];
  prices: Record<AssetSymbol, number>;
  quests: Quest[];
  marketHistory: Record<AssetSymbol, { time: number; price: number }[]>;
}

export interface TradeParams {
  symbol: AssetSymbol;
  type: PositionType;
  amount: number;
  leverage: number;
}
