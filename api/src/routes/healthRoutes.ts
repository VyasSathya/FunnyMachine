import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Database health check
router.get('/db', async (req, res) => {
  const pool = new Pool({
    user: process.env.DB_USER || 'funnymachine',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'funnymachine',
    password: process.env.DB_PASSWORD || 'funnymachine',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    const result = await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  } finally {
    await pool.end();
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const pool = new Pool({
    user: process.env.DB_USER || 'funnymachine',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'funnymachine',
    password: process.env.DB_PASSWORD || 'funnymachine',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    const [dbResult, memoryUsage] = await Promise.all([
      pool.query('SELECT 1'),
      Promise.resolve(process.memoryUsage())
    ]);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
      },
      database: {
        status: 'connected',
        query: dbResult.rows[0]
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await pool.end();
  }
});

export default router; 