/**
 * Launches Routes
 * API endpoints for token launches
 */

import { Router } from 'express';
import { query } from '../db/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /api/launches:
 *   get:
 *     summary: List all token launches
 *     tags: [Launches]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, graduated, closed]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of launches
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let sql = `
      SELECT * FROM active_launches
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${
      params.length + 2
    }`;
    params.push(limit, offset);

    const launches = await query(sql, params);

    // Get total count
    const countResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM launches WHERE status = $1',
      [status || 'active']
    );

    res.json({
      success: true,
      data: {
        launches,
        total: parseInt(countResult[0]?.count?.toString() || '0'),
        limit,
        offset,
      },
    });
  })
);

/**
 * @swagger
 * /api/launches/{id}:
 *   get:
 *     summary: Get launch details
 *     tags: [Launches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Launch details
 *       404:
 *         description: Launch not found
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const launches = await query(
      `SELECT * FROM active_launches WHERE id = $1 OR token_address = $1`,
      [id]
    );

    if (launches.length === 0) {
      throw new ApiError(404, 'Launch not found');
    }

    // Get recent contributions (without revealing amounts)
    const contributions = await query(
      `SELECT
        commitment,
        nullifier,
        contribution_type,
        timestamp,
        block_number
       FROM contributions
       WHERE launch_id = $1
       ORDER BY timestamp DESC
       LIMIT 10`,
      [launches[0].id]
    );

    res.json({
      success: true,
      data: {
        launch: launches[0],
        recent_contributions: contributions,
      },
    });
  })
);

/**
 * @swagger
 * /api/launches:
 *   post:
 *     summary: Create new token launch
 *     tags: [Launches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - symbol
 *               - total_supply
 *               - bonding_curve_type
 *               - creator_proof
 *             properties:
 *               name:
 *                 type: string
 *               symbol:
 *                 type: string
 *               total_supply:
 *                 type: string
 *     responses:
 *       201:
 *         description: Launch created
 */
router.post(
  '/',
  validate(schemas.createLaunch),
  asyncHandler(async (req, res) => {
    const {
      name,
      symbol,
      total_supply,
      bonding_curve_type,
      base_price,
      graduation_threshold,
      creator_proof,
    } = req.body;

    // In production, this would call the Starknet contract
    // For now, we simulate the launch creation

    logger.info('Launch creation requested', {
      name,
      symbol,
      bonding_curve_type,
    });

    res.status(201).json({
      success: true,
      message:
        'Launch creation submitted. Transaction will be processed on-chain.',
      data: {
        name,
        symbol,
        estimated_confirmation: '5-10 minutes',
      },
    });
  })
);

/**
 * @swagger
 * /api/launches/trending:
 *   get:
 *     summary: Get trending tokens
 *     tags: [Launches]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending tokens
 */
router.get(
  '/trending',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const trending = await query(
      `SELECT * FROM trending_tokens LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: {
        trending,
      },
    });
  })
);

export default router;
