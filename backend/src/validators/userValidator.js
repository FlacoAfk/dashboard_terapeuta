/**
 * ========================================
 * VALIDADOR DE USUARIOS
 * ========================================
 */

const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validationUtils');

const validateUserCreate = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('correo')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('Debe ser un correo válido'),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 10 }).withMessage('La contraseña debe tener al menos 10 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula')
        .matches(/\d/).withMessage('La contraseña debe contener al menos un número')
        .matches(/[@$!%*?&]/).withMessage('La contraseña debe contener al menos un símbolo (@$!%*?&)'),
    body('especialidad')
        .optional()
        .trim(),
    body('telefono')
        .optional()
        .trim()
        .matches(/^[0-9]+$/).withMessage('El teléfono solo debe contener números'),
    handleValidationErrors
];

const validateUserUpdate = [
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('correo')
        .optional()
        .trim()
        .isEmail().withMessage('Debe ser un correo válido'),
    body('password')
        .optional()
        .isLength({ min: 10 }).withMessage('La contraseña debe tener al menos 10 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula')
        .matches(/\d/).withMessage('La contraseña debe contener al menos un número')
        .matches(/[@$!%*?&]/).withMessage('La contraseña debe contener al menos un símbolo (@$!%*?&)'),
    handleValidationErrors
];

module.exports = { validateUserCreate, validateUserUpdate };
