/**
 * ZumpFun Backend Service
 * Production-grade REST API with real-time WebSocket support
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import config from './config.js';
import logger from './utils/logger.js';
import { testConnection, closePool } from './db/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { swaggerSpec } from './swagger.js';
import wsManager from './websocket/server.js';
import { startIndexer } from './indexer/events.js';

// Import routes
import launchesRouter from './routes/launches.js';
import contributionsRouter from './routes/contributions.js';
import marketRouter from './routes/market.js';
import proofsRouter from './routes/proofs.js';

// Initialize Express app
const app: Application = express();
const server = createServer(app);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.env === 'production' ? ['https://zumpfun.xyz'] : '*',
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.api.rateLimit.windowMs,
  max: config.api.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();

  res.json({
    status: dbStatus ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    services: {
      database: dbStatus ? 'up' : 'down',
      websocket: config.websocket.enabled ? 'enabled' : 'disabled',
      indexer: config.indexer.enabled ? 'enabled' : 'disabled',
    },
  });
});

// API status endpoint
app.get(`${config.api.prefix}/status`, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'ZumpFun API is running',
      network: config.starknet.network,
      features: {
        zkProofs: true,
        indexing: config.indexer.enabled,
        websocket: config.websocket.enabled,
        analytics: true,
      },
      contracts: {
        launchpadFactory: config.starknet.contractAddresses.launchpadFactory,
        garagaVerifier: config.starknet.contractAddresses.garagaVerifier,
        privacyPool: config.starknet.contractAddresses.privacyPool,
      },
    },
  });
});

// Mount API routes
app.use(`${config.api.prefix}/launches`, launchesRouter);
app.use(`${config.api.prefix}/contribute`, contributionsRouter);
app.use(`${config.api.prefix}/market`, marketRouter);
app.use(`${config.api.prefix}/proofs`, proofsRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize services
async function initialize() {
  try {
    logger.info('Initializing ZumpFun Backend...', {
      env: config.env,
      port: config.port,
      network: config.starknet.network,
    });

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize WebSocket server
    wsManager.initialize(server);

    // Start event indexer
    if (config.indexer.enabled) {
      startIndexer().catch((error) => {
        logger.error('Indexer failed to start:', { error });
      });
    }

    // Start HTTP server
    server.listen(config.port, () => {
      logger.info('🚀 ZumpFun Backend started successfully', {
        port: config.port,
        api: `http://localhost:${config.port}${config.api.prefix}`,
        docs: `http://localhost:${config.port}/api-docs`,
        websocket: config.websocket.enabled
          ? `ws://localhost:${config.port}${config.websocket.path}`
          : 'disabled',
      });
    });
  } catch (error) {
    logger.error('Failed to initialize server:', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  server.close(async () => {
    logger.info('HTTP server closed');

    // Close WebSocket connections
    wsManager.close();

    // Close database pool
    await closePool();

    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.emit('SIGTERM' as any);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', { reason, promise });
  process.exit(1);
});

// Start the server
initialize();

export default app;
