/**
 * ========================================
 * UTILIDAD DE MANEJO DE ERRORES DE VALIDACIÓN
 * ========================================
 * 
 * Middleware reutilizable para manejar errores de express-validator.
 * Extrae el primer error y retorna una respuesta JSON consistente.
 */

const { validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 * Uso: Agregar al final de un array de validaciones
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: errors.array()[0].msg,
            details: errors.array()
        });
    }
    next();
};

module.exports = { handleValidationErrors };
