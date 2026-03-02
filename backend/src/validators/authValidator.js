/**
 * ========================================
 * VALIDADOR DE AUTENTICACIÓN
 * ========================================
 */

const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validationUtils');

const validateLogin = [
    body('email')
        .trim()
        .toLowerCase()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('Debe ser un correo electrónico válido'),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida'),
    handleValidationErrors
];

module.exports = { validateLogin };
