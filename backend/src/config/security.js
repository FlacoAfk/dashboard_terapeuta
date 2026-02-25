const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

function buildSecurityMiddleware() {
    const enableHelmet = process.env.HELMET_ENABLED !== 'false';
    const enableRateLimit = process.env.RATE_LIMIT_ENABLED !== 'false';

    const middlewares = [];

    if (enableHelmet) {
        middlewares.push(
            helmet({
                crossOriginResourcePolicy: false,
                contentSecurityPolicy: false
            })
        );
    }

    if (enableRateLimit) {
        const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
        const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300);

        middlewares.push(
            rateLimit({
                windowMs,
                max: maxRequests,
                standardHeaders: true,
                legacyHeaders: false,
                message: {
                    success: false,
                    error: 'Demasiadas solicitudes. Intente nuevamente en unos minutos.',
                    code: 'RATE_LIMIT_EXCEEDED'
                },
                skip: (req) => req.path.startsWith('/health')
            })
        );
    }

    return middlewares;
}

module.exports = {
    buildSecurityMiddleware
};