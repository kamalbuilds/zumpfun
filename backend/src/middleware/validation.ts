/**
 * Request Validation Middleware
 * Joi-based request validation
 */

import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler.js';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      throw new ApiError(400, message);
    }

    req.body = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  createLaunch: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    symbol: Joi.string().min(1).max(32).required(),
    total_supply: Joi.string().required(),
    bonding_curve_type: Joi.string()
      .valid('linear', 'exponential', 'sigmoid')
      .required(),
    base_price: Joi.string().required(),
    graduation_threshold: Joi.string().required(),
    creator_proof: Joi.array().items(Joi.string()).required(),
  }),

  contribute: Joi.object({
    launch_id: Joi.string().uuid().required(),
    payment_proof: Joi.array().items(Joi.string()).required(),
    amount_commitment: Joi.string().required(),
    nullifier: Joi.string().required(),
    contribution_type: Joi.string().valid('buy', 'sell').required(),
  }),

  verifyProof: Joi.object({
    proof: Joi.array().items(Joi.string()).required(),
    public_inputs: Joi.array().items(Joi.string()).required(),
    circuit_type: Joi.string().required(),
  }),
};
