/**
 * ========================================
 * SERVIDOR BACKEND - Express
 * ========================================
 */

require('dotenv').config();

const resolveUnityApiKeyEnv = () => {
    const key = process.env.UNITY_API_KEY
        || process.env.API_KEY
        || process.env.X_API_KEY
        || process.env.AUTH_API_KEY
        || process.env.SESSION_API_KEY;

    if (key) {
        process.env.UNITY_API_KEY = key;
    }

    return key;
};

resolveUnityApiKeyEnv();

const { createApp } = require('./app');
const { testConnection } = require('./config/supabase');
const { initializeRedis } = require('./utils/cache');

const PORT = Number(process.env.PORT || 3001);
const app = createApp();

async function bootstrap() {
    await testConnection();
    await initializeRedis();

    app.listen(PORT, () => {
        console.log('');
        console.log('========================================');
        console.log('🚀 BACKEND INICIADO (Supabase)');
        console.log('========================================');
        console.log(`📡 Servidor:  http://localhost:${PORT}`);
        console.log(`❤️  Health:    http://localhost:${PORT}/health`);
        console.log(`✅ Ready:      http://localhost:${PORT}/health/ready`);
        console.log(`📋 API:        http://localhost:${PORT}/api/status`);
        console.log(`📚 Docs:       http://localhost:${PORT}/api-docs`);
        console.log('========================================');
        console.log('');
    });
}

bootstrap().catch((error) => {
    console.error('❌ Error iniciando servidor:', error.message);
    process.exit(1);
});

module.exports = app;