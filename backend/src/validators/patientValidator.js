/**
 * ========================================
 * VALIDADOR DE PACIENTES
 * ========================================
 */

const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validationUtils');

const validatePatient = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('identificacion')
        .optional()
        .trim(),
    body('edad')
        .optional()
        .isInt({ min: 0, max: 120 }).withMessage('La edad debe ser un número válido entre 0 y 120'),
    body('diagnostico')
        .optional()
        .trim(),
    handleValidationErrors
];

const validatePatientAssign = [
    body('id_terapeuta')
        .notEmpty().withMessage('El ID del terapeuta es requerido')
        .isInt().withMessage('El ID del terapeuta debe ser un número entero'),
    handleValidationErrors
];

module.exports = { validatePatient, validatePatientAssign };
