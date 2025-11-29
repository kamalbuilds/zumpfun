/**
 * Swagger API Documentation Configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';
import config from './config.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZumpFun API',
      version: '0.1.0',
      description:
        'Privacy-preserving meme-coin launchpad backend API built on Ztarknet',
      contact: {
        name: 'ZumpFun Team',
        url: 'https://zumpfun.xyz',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.api.prefix}`,
        description: 'Development server',
      },
      {
        url: 'https://api.zumpfun.xyz/api',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Launch: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Launch ID',
            },
            token_address: {
              type: 'string',
              description: 'Starknet contract address',
            },
            creator_commitment: {
              type: 'string',
              description: 'ZK commitment of creator identity',
            },
            name: {
              type: 'string',
              description: 'Token name',
            },
            symbol: {
              type: 'string',
              description: 'Token symbol',
            },
            total_supply: {
              type: 'string',
              description: 'Total token supply',
            },
            bonding_curve_type: {
              type: 'string',
              enum: ['linear', 'exponential', 'sigmoid'],
              description: 'Bonding curve type',
            },
            status: {
              type: 'string',
              enum: ['active', 'graduated', 'closed'],
              description: 'Launch status',
            },
            current_price: {
              type: 'string',
              description: 'Current token price',
            },
            total_raised: {
              type: 'string',
              description: 'Total amount raised',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        Contribution: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            launch_id: {
              type: 'string',
              format: 'uuid',
            },
            commitment: {
              type: 'string',
              description: 'ZK commitment',
            },
            nullifier: {
              type: 'string',
              description: 'Nullifier for double-spend protection',
            },
            contribution_type: {
              type: 'string',
              enum: ['buy', 'sell'],
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        MarketData: {
          type: 'object',
          properties: {
            token_address: {
              type: 'string',
            },
            current_price: {
              type: 'string',
            },
            price_change_24h: {
              type: 'number',
              format: 'float',
            },
            volume_24h: {
              type: 'string',
            },
            market_cap: {
              type: 'string',
            },
            holder_count: {
              type: 'integer',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Proof: {
          type: 'object',
          properties: {
            proof_hash: {
              type: 'string',
            },
            circuit_type: {
              type: 'string',
            },
            verification_status: {
              type: 'string',
              enum: ['pending', 'verified', 'failed'],
            },
            verified_at: {
              type: 'string',
              format: 'date-time',
            },
            gas_used: {
              type: 'integer',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
                statusCode: {
                  type: 'integer',
                },
              },
            },
          },
        },
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        BadRequest: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Launches',
        description: 'Token launch operations',
      },
      {
        name: 'Contributions',
        description: 'Private contribution operations',
      },
      {
        name: 'Market',
        description: 'Market data and analytics',
      },
      {
        name: 'Proofs',
        description: 'ZK proof verification',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
