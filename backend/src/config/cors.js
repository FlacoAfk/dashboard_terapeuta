const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'file://'
];

function getVercelProjectSuffix() {
    return String(process.env.CORS_ALLOWED_VERCEL_PROJECT_SUFFIX || '').trim().toLowerCase();
}

function getAllowedOrigins() {
    const configured = process.env.CORS_ALLOWED_ORIGINS;
    if (!configured || !configured.trim()) {
        return DEFAULT_ALLOWED_ORIGINS;
    }

    return configured
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
}

function buildCorsOptions() {
    const allowedOrigins = new Set(getAllowedOrigins());
    const vercelProjectSuffix = getVercelProjectSuffix();

    const isLoopbackOrigin = (origin) => {
        if (!origin || typeof origin !== 'string') {
            return false;
        }

        return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    };

    const isElectronNullOrigin = (origin) => origin === 'null';
    const isAllowedVercelPreview = (origin) => {
        if (!origin || !vercelProjectSuffix) {
            return false;
        }

        try {
            const parsed = new URL(origin);
            return (
                parsed.protocol === 'https:' &&
                parsed.hostname.endsWith(`-${vercelProjectSuffix}.vercel.app`)
            );
        } catch {
            return false;
        }
    };

    return {
        credentials: true,
        origin(origin, callback) {
            if (!origin) {
                callback(null, true);
                return;
            }

            if (
                allowedOrigins.has(origin) ||
                isLoopbackOrigin(origin) ||
                isElectronNullOrigin(origin) ||
                isAllowedVercelPreview(origin)
            ) {
                callback(null, true);
                return;
            }

            callback(new Error(`Origen no permitido por CORS: ${origin}`));
        }
    };
}

module.exports = {
    buildCorsOptions,
    getAllowedOrigins,
    DEFAULT_ALLOWED_ORIGINS
};
