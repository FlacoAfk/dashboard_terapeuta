const { body, validationResult } = require('express-validator');

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
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/\d/).withMessage('La contraseña debe contener al menos un número'),
    body('especialidad')
        .optional()
        .trim(),
    body('telefono')
        .optional()
        .trim()
        .matches(/^[0-9]+$/).withMessage('El teléfono solo debe contener números'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg,
                details: errors.array()
            });
        }
        next();
    }
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
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg,
                details: errors.array()
            });
        }
        next();
    }
];

module.exports = { validateUserCreate, validateUserUpdate };
