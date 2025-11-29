/**
 * Market Data Routes
 * API endpoints for market data and analytics
 */

import { Router } from 'express';
import { query } from '../db/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /api/market/{tokenAddress}:
 *   get:
 *     summary: Get current market data for token
 *     tags: [Market]
 *     parameters:
 *       - in: path
 *         name: tokenAddress
 *         required: true
 *     responses:
 *       200:
 *         description: Market data
 */
router.get(
  '/:tokenAddress',
  asyncHandler(async (req, res) => {
    const { tokenAddress } = req.params;

    const marketData = await query(
      `SELECT * FROM market_data
       WHERE token_address = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [tokenAddress]
    );

    if (marketData.length === 0) {
      throw new ApiError(404, 'Market data not found');
    }

    res.json({
      success: true,
      data: marketData[0],
    });
  })
);

/**
 * @swagger
 * /api/market/{tokenAddress}/history:
 *   get:
 *     summary: Get price history for token
 *     tags: [Market]
 *     parameters:
 *       - in: path
 *         name: tokenAddress
 *         required: true
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           default: 1 hour
 *       - in: query
 *         name: duration
 *         schema:
 *           type: string
 *           default: 24 hours
 *     responses:
 *       200:
 *         description: Price history
 */
router.get(
  '/:tokenAddress/history',
  asyncHandler(async (req, res) => {
    const { tokenAddress } = req.params;
    const interval = (req.query.interval as string) || '1 hour';
    const duration = (req.query.duration as string) || '24 hours';

    const history = await query(
      `SELECT * FROM get_price_history($1, $2, $3)`,
      [tokenAddress, interval, duration]
    );

    res.json({
      success: true,
      data: {
        token_address: tokenAddress,
        interval,
        duration,
        data_points: history,
      },
    });
  })
);

/**
 * @swagger
 * /api/market/stats/global:
 *   get:
 *     summary: Get global market statistics
 *     tags: [Market]
 *     responses:
 *       200:
 *         description: Global stats
 */
router.get(
  '/stats/global',
  asyncHandler(async (req, res) => {
    const stats = await query(`
      SELECT
        COUNT(DISTINCT token_address) as total_tokens,
        COUNT(*) as total_contributions,
        SUM(CASE WHEN contribution_type = 'buy' THEN 1 ELSE 0 END) as total_buys,
        SUM(CASE WHEN contribution_type = 'sell' THEN 1 ELSE 0 END) as total_sells
      FROM contributions
    `);

    const launchStats = await query(`
      SELECT
        COUNT(*) as total_launches,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_launches,
        COUNT(CASE WHEN status = 'graduated' THEN 1 END) as graduated_launches
      FROM launches
    `);

    res.json({
      success: true,
      data: {
        contributions: stats[0],
        launches: launchStats[0],
      },
    });
  })
);

export default router;
