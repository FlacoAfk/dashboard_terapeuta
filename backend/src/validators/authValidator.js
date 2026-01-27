const { body, validationResult } = require('express-validator');

const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('Debe ser un correo electrónico válido'),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg, // Return the first error message
                details: errors.array()
            });
        }
        next();
    }
];

module.exports = { validateLogin };
