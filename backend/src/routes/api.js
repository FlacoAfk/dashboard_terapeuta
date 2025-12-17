/**
 * ========================================
 * RUTAS DE LA API
 * ========================================
 * 
 * Aquí se definen todos los endpoints de la API.
 * Todas las rutas empiezan con /api/
 * 
 * Ejemplo: GET /api/patients
 */

const express = require('express');
const router = express.Router();

// ========================================
// ESTADO DE LA API
// ========================================

/**
 * GET /api/status
 * Retorna información sobre la API
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        version: '1.0.0'
    });
});

// ========================================
// PACIENTES
// ========================================

/**
 * GET /api/patients
 * Obtener todos los pacientes
 * 
 * TODO: Conectar con base de datos
 */
router.get('/patients', (req, res) => {
    // Datos de ejemplo (reemplazar con consulta a BD)
    const patients = [
        { id: 1, name: 'Juan Pérez', age: 28, email: 'juan@email.com' },
        { id: 2, name: 'María García', age: 35, email: 'maria@email.com' }
    ];

    res.json({ success: true, data: patients });
});

/**
 * POST /api/patients
 * Crear un nuevo paciente
 * 
 * Body esperado: { name: string, age: number, email: string }
 */
router.post('/patients', (req, res) => {
    const { name, age, email } = req.body;

    // Validación básica
    if (!name) {
        return res.status(400).json({
            success: false,
            error: 'El nombre es requerido'
        });
    }

    // TODO: Guardar en base de datos
    const newPatient = {
        id: Date.now(), // ID temporal
        name,
        age,
        email
    };

    res.status(201).json({
        success: true,
        message: 'Paciente creado exitosamente',
        data: newPatient
    });
});

// ========================================
// SESIONES
// ========================================

/**
 * GET /api/sessions
 * Obtener todas las sesiones de terapia
 * 
 * TODO: Conectar con base de datos
 */
router.get('/sessions', (req, res) => {
    // Datos de ejemplo
    const sessions = [
        { id: 1, patientId: 1, date: '2024-12-17', notes: 'Primera sesión' },
        { id: 2, patientId: 1, date: '2024-12-24', notes: 'Seguimiento' }
    ];

    res.json({ success: true, data: sessions });
});

// ========================================
// AGREGA TUS NUEVAS RUTAS AQUÍ
// ========================================

// Ejemplo:
// router.get('/mi-ruta', (req, res) => {
//   res.json({ success: true, data: [...] });
// });

module.exports = router;
