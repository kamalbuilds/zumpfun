/**
 * Database Connection Pool
 * PostgreSQL connection management with pg
 */

import pkg from 'pg';
const { Pool } = pkg;
import config from '../config.js';
import logger from '../utils/logger.js';

// Create connection pool
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: config.database.maxConnections,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
});

// Pool event handlers
pool.on('connect', () => {
  logger.info('PostgreSQL pool: New client connected');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', { error: err.message });
});

pool.on('remove', () => {
  logger.info('PostgreSQL pool: Client removed');
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connection successful', {
      timestamp: result.rows[0].now,
    });

    return true;
  } catch (error) {
    logger.error('Database connection failed:', { error });
    return false;
  }
};

// Execute query with error handling
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<T[]> => {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Query executed', {
      text,
      duration: `${duration}ms`,
      rows: result.rowCount,
    });

    return result.rows;
  } catch (error) {
    logger.error('Query error:', {
      text,
      params,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

// Transaction helper
export const transaction = async <T>(
  callback: (client: pkg.PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back:', { error });
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  await pool.end();
  logger.info('Database pool closed');
};

export default pool;
