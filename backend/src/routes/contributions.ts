/**
 * Contributions Routes
 * API endpoints for private contributions
 */

import { Router } from 'express';
import { query } from '../db/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /api/contribute:
 *   post:
 *     summary: Submit private contribution
 *     tags: [Contributions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - launch_id
 *               - payment_proof
 *               - amount_commitment
 *               - nullifier
 *             properties:
 *               launch_id:
 *                 type: string
 *               payment_proof:
 *                 type: array
 *     responses:
 *       201:
 *         description: Contribution submitted
 */
router.post(
  '/',
  validate(schemas.contribute),
  asyncHandler(async (req, res) => {
    const {
      launch_id,
      payment_proof,
      amount_commitment,
      nullifier,
      contribution_type,
    } = req.body;

    // Check if launch exists
    const launches = await query('SELECT * FROM launches WHERE id = $1', [
      launch_id,
    ]);

    if (launches.length === 0) {
      throw new ApiError(404, 'Launch not found');
    }

    // Check if nullifier is already used (double-spend protection)
    const existing = await query(
      'SELECT * FROM contributions WHERE nullifier = $1',
      [nullifier]
    );

    if (existing.length > 0) {
      throw new ApiError(400, 'Nullifier already used');
    }

    // In production, this would:
    // 1. Verify ZK proof locally
    // 2. Submit to Starknet contract
    // 3. Wait for confirmation

    logger.info('Contribution submitted', {
      launch_id,
      contribution_type,
      nullifier,
    });

    res.status(201).json({
      success: true,
      message: 'Contribution submitted for on-chain processing',
      data: {
        launch_id,
        contribution_type,
        estimated_confirmation: '2-5 minutes',
      },
    });
  })
);

/**
 * @swagger
 * /api/contributions/launch/{launchId}:
 *   get:
 *     summary: Get contributions for a launch (public data only)
 *     tags: [Contributions]
 *     parameters:
 *       - in: path
 *         name: launchId
 *         required: true
 *     responses:
 *       200:
 *         description: List of contributions
 */
router.get(
  '/launch/:launchId',
  asyncHandler(async (req, res) => {
    const { launchId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

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
       LIMIT $2 OFFSET $3`,
      [launchId, limit, offset]
    );

    const countResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM contributions WHERE launch_id = $1',
      [launchId]
    );

    res.json({
      success: true,
      data: {
        contributions,
        total: parseInt(countResult[0]?.count?.toString() || '0'),
        limit,
        offset,
      },
    });
  })
);

export default router;
