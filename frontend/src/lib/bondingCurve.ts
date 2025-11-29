/**
 * Bonding curve calculations for token pricing
 *
 * Formula: price = basePrice + (supply^2 / scalingFactor)
 * This creates an exponential curve where price increases as supply grows
 */

export interface BondingCurveConfig {
  basePrice: number;
  scalingFactor: number;
  graduationThreshold: number;
}

export class BondingCurve {
  private basePrice: number;
  private scalingFactor: number;
  private graduationThreshold: number;

  constructor(config: BondingCurveConfig) {
    this.basePrice = config.basePrice;
    this.scalingFactor = config.scalingFactor;
    this.graduationThreshold = config.graduationThreshold;
  }

  /**
   * Calculate current price based on supply
   */
  getPrice(supply: number): number {
    return this.basePrice + (supply * supply) / this.scalingFactor;
  }

  /**
   * Calculate cost to buy a specific amount of tokens
   */
  getBuyCost(currentSupply: number, amount: number): number {
    let totalCost = 0;
    const steps = 100; // Integration steps for accuracy
    const stepSize = amount / steps;

    for (let i = 0; i < steps; i++) {
      const supply = currentSupply + (i * stepSize);
      const price = this.getPrice(supply);
      totalCost += price * stepSize;
    }

    return totalCost;
  }

  /**
   * Calculate return from selling a specific amount of tokens
   */
  getSellReturn(currentSupply: number, amount: number): number {
    let totalReturn = 0;
    const steps = 100; // Integration steps for accuracy
    const stepSize = amount / steps;

    for (let i = 0; i < steps; i++) {
      const supply = currentSupply - (i * stepSize);
      const price = this.getPrice(supply);
      totalReturn += price * stepSize;
    }

    return totalReturn;
  }

  /**
   * Calculate price impact percentage
   */
  getPriceImpact(currentSupply: number, amount: number, isBuy: boolean): number {
    const currentPrice = this.getPrice(currentSupply);
    const newSupply = isBuy ? currentSupply + amount : currentSupply - amount;
    const newPrice = this.getPrice(newSupply);

    return ((newPrice - currentPrice) / currentPrice) * 100;
  }

  /**
   * Calculate average price for a trade
   */
  getAveragePrice(currentSupply: number, amount: number, isBuy: boolean): number {
    const cost = isBuy
      ? this.getBuyCost(currentSupply, amount)
      : this.getSellReturn(currentSupply, amount);

    return cost / amount;
  }

  /**
   * Check if token has reached graduation threshold
   */
  hasGraduated(currentSupply: number): boolean {
    return currentSupply >= this.graduationThreshold;
  }

  /**
   * Calculate progress to graduation (0-100%)
   */
  getGraduationProgress(currentSupply: number): number {
    return Math.min((currentSupply / this.graduationThreshold) * 100, 100);
  }

  /**
   * Calculate tokens needed to reach graduation
   */
  getTokensToGraduation(currentSupply: number): number {
    return Math.max(this.graduationThreshold - currentSupply, 0);
  }

  /**
   * Estimate cost to reach graduation from current supply
   */
  getCostToGraduation(currentSupply: number): number {
    const tokensNeeded = this.getTokensToGraduation(currentSupply);
    if (tokensNeeded === 0) return 0;

    return this.getBuyCost(currentSupply, tokensNeeded);
  }

  /**
   * Generate curve points for visualization
   */
  generateCurvePoints(points = 100): Array<{ supply: number; price: number }> {
    const step = this.graduationThreshold / points;
    const curvePoints = [];

    for (let i = 0; i <= points; i++) {
      const supply = i * step;
      const price = this.getPrice(supply);
      curvePoints.push({ supply, price });
    }

    return curvePoints;
  }

  /**
   * Calculate slippage for a trade
   */
  calculateSlippage(
    currentSupply: number,
    amount: number,
    isBuy: boolean,
    maxSlippage: number
  ): { withinTolerance: boolean; actualSlippage: number } {
    const currentPrice = this.getPrice(currentSupply);
    const avgPrice = this.getAveragePrice(currentSupply, amount, isBuy);
    const actualSlippage = Math.abs((avgPrice - currentPrice) / currentPrice) * 100;

    return {
      withinTolerance: actualSlippage <= maxSlippage,
      actualSlippage,
    };
  }

  /**
   * Get estimated AMM price after graduation
   */
  getEstimatedAMMPrice(): number {
    // AMM price is the bonding curve price at graduation threshold
    return this.getPrice(this.graduationThreshold);
  }
}

/**
 * Default bonding curve configuration
 */
export const DEFAULT_BONDING_CURVE: BondingCurveConfig = {
  basePrice: 0.0001, // 0.0001 SOL base price
  scalingFactor: 1000000000, // Scaling factor for curve steepness
  graduationThreshold: 1000000, // 1M tokens to graduate
};

/**
 * Create a bonding curve instance with default or custom config
 */
export function createBondingCurve(config?: Partial<BondingCurveConfig>): BondingCurve {
  return new BondingCurve({
    ...DEFAULT_BONDING_CURVE,
    ...config,
  });
}
