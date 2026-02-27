const express = require('express');
const { testConnection } = require('../config/supabase');
const { getRedisClient } = require('../utils/cache');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Estado general del backend
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Backend operativo
 */
router.get('/health', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.json({
        status: 'ok',
        message: 'Backend funcionando correctamente',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        docs: `${baseUrl}/api-docs`
    });
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Proceso vivo
 */
router.get('/health/live', (req, res) => {
    res.json({
        status: 'alive',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe (DB/Redis)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Dependencias listas
 *       503:
 *         description: Dependencias no listas
 */
router.get('/health/ready', async (req, res) => {
    const dbReady = await testConnection();
    const redisReady = !!getRedisClient() || process.env.REDIS_CACHE_ENABLED === 'false';

    if (!dbReady) {
        return res.status(503).json({
            status: 'not_ready',
            requestId: req.requestId,
            checks: {
                database: dbReady,
                redis: redisReady
            }
        });
    }

    return res.json({
        status: 'ready',
        requestId: req.requestId,
        checks: {
            database: dbReady,
            redis: redisReady
        }
    });
});

module.exports = router;
