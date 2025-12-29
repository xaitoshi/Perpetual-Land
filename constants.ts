
import { Asset, Quest, AssetSymbol } from './types';

export const INITIAL_BALANCE = 10000;
export const GROUND_SIZE = 30;

export const ASSETS: Record<AssetSymbol, Asset> = {
  ETH: { symbol: 'ETH', name: 'Ethereum', price: 3000, volatility: 0.02, trend: 0.1 },
  BTC: { symbol: 'BTC', name: 'Bitcoin', price: 60000, volatility: 0.015, trend: 0.05 },
  SOL: { symbol: 'SOL', name: 'Solana', price: 150, volatility: 0.04, trend: -0.05 },
};

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'first_growth',
    title: 'Plant a Seed',
    description: 'Open your first LONG position to plant a tree in your biome.',
    reward: 50,
    completed: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'diversify',
    title: 'Ecosystem Diversity',
    description: 'Have at least 2 active positions (Long or Short) simultaneously.',
    reward: 100,
    completed: false,
    progress: 0,
    maxProgress: 2,
  },
  {
    id: 'sustainable_trader',
    title: 'Sustainable Growth',
    description: 'Close a position with at least +5% profit.',
    reward: 200,
    completed: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'risk_manager',
    title: 'Storm Weatherer',
    description: 'Keep a high leverage (5x) position open for 30 seconds without liquidation.',
    reward: 300,
    completed: false,
    progress: 0,
    maxProgress: 30,
  },
];

export const TUTORIAL_STEPS = [
  {
    title: "Welcome to Eco-Sim Perps",
    content: "This is a trading simulation where your portfolio is a living biome. Your goal is to grow your ecosystem while managing financial risk."
  },
  {
    title: "Longs are Life",
    content: "Opening a LONG position (betting price goes up) plants trees. Profitable trades make them bloom. Losses make them wither."
  },
  {
    title: "Shorts are Structure",
    content: "Opening a SHORT position (betting price goes down) raises mountains. Profits make them sturdy. Losses cause erosion."
  },
  {
    title: "Sustainability is Key",
    content: "High leverage decreases your Sustainability Score, risking 'climate disasters' (liquidations). Trade wisely!"
  }
];
