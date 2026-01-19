/**
 * ========================================
 * MIDDLEWARE DE AUTENTICACIÓN
 * ========================================
 * 
 * Validación de JWT y control de roles
 * Requerimientos: RF-SEG-01, RF-SEG-02, RF-SEG-03
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cerebro_al_fuego_secret_key_2024';
const JWT_EXPIRES_IN = '24h';

/**
 * Middleware para verificar el token JWT
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token de autenticación requerido',
            code: 'AUTH_REQUIRED'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado, inicie sesión nuevamente',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(403).json({
            success: false,
            error: 'Token inválido',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Middleware para verificar rol de Superadministrador
 * RF-SEG-01, RF-SEG-02
 */
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Autenticación requerida',
            code: 'AUTH_REQUIRED'
        });
    }

    if (req.user.rol !== 'SUPERADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requiere rol de Superadministrador',
            code: 'SUPERADMIN_REQUIRED'
        });
    }

    next();
};

/**
 * Middleware para verificar rol de Terapeuta o superior
 * RF-SEG-03
 */
const requireTerapeuta = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Autenticación requerida',
            code: 'AUTH_REQUIRED'
        });
    }

    const allowedRoles = ['SUPERADMIN', 'TERAPEUTA'];
    if (!allowedRoles.includes(req.user.rol)) {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requiere rol de Terapeuta o superior',
            code: 'TERAPEUTA_REQUIRED'
        });
    }

    next();
};

/**
 * Generar token JWT
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            rol: user.rol,
            id_terapeuta: user.id_terapeuta || null
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Middleware opcional - no falla si no hay token
 * Útil para rutas que pueden ser públicas o autenticadas
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token inválido pero continuamos sin usuario
            req.user = null;
        }
    } else {
        req.user = null;
    }

    next();
};

module.exports = {
    authenticateToken,
    requireSuperAdmin,
    requireTerapeuta,
    generateToken,
    optionalAuth,
    JWT_SECRET,
    JWT_EXPIRES_IN
};
