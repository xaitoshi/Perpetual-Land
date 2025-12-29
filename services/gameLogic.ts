import { Position, Asset } from '../types';

export const calculatePnL = (position: Position, currentPrice: number) => {
  const priceDiff = currentPrice - position.entryPrice;
  // If Long, positive diff is profit. If Short, negative diff is profit.
  const directionMultiplier = position.type === 'LONG' ? 1 : -1;
  
  // PnL = (Price Diff / Entry Price) * Size * Leverage * Direction
  const rawPnlPercent = (priceDiff / position.entryPrice) * directionMultiplier;
  const pnlPercent = rawPnlPercent * position.leverage;
  const pnl = position.collateral * pnlPercent;

  return { pnl, pnlPercent: pnlPercent * 100 };
};

export const generateNextPrice = (currentPrice: number, volatility: number, trend: number) => {
  const randomMove = (Math.random() - 0.5) * 2; // -1 to 1
  const changePercent = (randomMove * volatility) + (trend * 0.001); // minor trend influence
  return currentPrice * (1 + changePercent);
};

export const calculateSustainability = (positions: Position[], balance: number) => {
  if (positions.length === 0) return 100;

  // Base score
  let score = 100;

  // Penalty for high leverage avg
  const totalLeverage = positions.reduce((acc, p) => acc + p.leverage, 0);
  const avgLeverage = totalLeverage / positions.length;
  score -= (avgLeverage - 1) * 10; 

  // Penalty for using too much balance (over-exposure)
  const totalCollateral = positions.reduce((acc, p) => acc + p.collateral, 0);
  const exposureRatio = totalCollateral / (balance + totalCollateral); // Approx total equity
  if (exposureRatio > 0.5) score -= 20;
  if (exposureRatio > 0.8) score -= 30;

  return Math.max(0, Math.min(100, Math.round(score)));
};