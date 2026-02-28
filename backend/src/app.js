const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { buildCorsOptions } = require('./config/cors');
const { buildSecurityMiddleware } = require('./config/security');
const { requestContext } = require('./middleware/requestContext');

const healthRoutes = require('./routes/health');
const apiRoutes = require('./routes/api');
const apiExtendedRoutes = require('./routes/apiExtended');
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const auditRoutes = require('./routes/audit');
const vrResultsRoutes = require('./routes/vrResults');
const sessionsRoutes = require('./routes/sessions');

function createApp() {
    const app = express();
    // Cloud Run está detrás de proxy. Necesario para rate-limit/IP real.
    app.set('trust proxy', 1);

    app.use(requestContext);
    app.use((req, res, next) => {
        const start = Date.now();

        res.on('finish', () => {
            console.log(JSON.stringify({
                level: 'info',
                type: 'http_request',
                requestId: req.requestId,
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: Date.now() - start
            }));
        });

        next();
    });

    app.use(cors(buildCorsOptions()));

    for (const middleware of buildSecurityMiddleware()) {
        app.use(middleware);
    }

    app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));
    app.use(express.urlencoded({ extended: true }));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Dashboard Terapeuta - API Docs'
    }));

    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    app.use('/', healthRoutes);

    // IMPORTANTE: /api/sessions debe montarse ANTES de /api para evitar conflictos de rutas
    app.use('/api/sessions', sessionsRoutes);
    app.use('/api', apiRoutes);
    app.use('/api', apiExtendedRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/usuarios', usuariosRoutes);
    app.use('/api/audit', auditRoutes);
    app.use('/api/v1', vrResultsRoutes);

    app.use((err, req, res, _next) => {
        const status = err.status || 500;

        console.error(JSON.stringify({
            level: 'error',
            message: err.message,
            requestId: req.requestId,
            path: req.originalUrl,
            status
        }));

        res.status(status).json({
            success: false,
            error: err.message || 'Error interno del servidor',
            requestId: req.requestId
        });
    });

    return app;
}

module.exports = { createApp };
