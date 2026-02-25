const express = require('express');
const { testConnection } = require('../config/supabase');
const { getRedisClient } = require('../utils/cache');

const router = express.Router();

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

router.get('/health/live', (req, res) => {
    res.json({
        status: 'alive',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
    });
});

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