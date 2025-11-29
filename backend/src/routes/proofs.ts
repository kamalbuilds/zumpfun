/**
 * Proof Verification Routes
 * API endpoints for ZK proof verification
 */

import { Router } from 'express';
import { query } from '../db/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /api/proofs/verify:
 *   post:
 *     summary: Verify ZK proof
 *     tags: [Proofs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proof
 *               - public_inputs
 *               - circuit_type
 *     responses:
 *       200:
 *         description: Proof verification result
 */
router.post(
  '/verify',
  validate(schemas.verifyProof),
  asyncHandler(async (req, res) => {
    const { proof, public_inputs, circuit_type } = req.body;

    // Generate proof hash
    const proofHash = `0x${Buffer.from(JSON.stringify(proof))
      .toString('hex')
      .slice(0, 64)}`;

    // Check if already verified
    const existing = await query(
      'SELECT * FROM proofs WHERE proof_hash = $1',
      [proofHash]
    );

    if (existing.length > 0 && existing[0].verification_status === 'verified') {
      return res.json({
        success: true,
        data: {
          proof_hash: proofHash,
          verification_status: 'verified',
          cached: true,
        },
      });
    }

    // In production, this would:
    // 1. Call Garaga verifier on-chain
    // 2. Wait for verification result
    // 3. Store result in database

    logger.info('Proof verification requested', {
      proof_hash: proofHash,
      circuit_type,
    });

    // Store pending proof
    await query(
      `INSERT INTO proofs (
        proof_hash,
        circuit_type,
        public_inputs,
        verification_status
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (proof_hash) DO NOTHING`,
      [proofHash, circuit_type, JSON.stringify(public_inputs), 'pending']
    );

    res.json({
      success: true,
      message: 'Proof submitted for on-chain verification',
      data: {
        proof_hash: proofHash,
        verification_status: 'pending',
        estimated_time: '30-60 seconds',
      },
    });
  })
);

/**
 * @swagger
 * /api/proofs/{proofHash}:
 *   get:
 *     summary: Get proof verification status
 *     tags: [Proofs]
 *     parameters:
 *       - in: path
 *         name: proofHash
 *         required: true
 *     responses:
 *       200:
 *         description: Proof status
 */
router.get(
  '/:proofHash',
  asyncHandler(async (req, res) => {
    const { proofHash } = req.params;

    const proofs = await query('SELECT * FROM proofs WHERE proof_hash = $1', [
      proofHash,
    ]);

    if (proofs.length === 0) {
      throw new ApiError(404, 'Proof not found');
    }

    res.json({
      success: true,
      data: proofs[0],
    });
  })
);

export default router;
