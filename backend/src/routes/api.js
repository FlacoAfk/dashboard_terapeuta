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
    // TODO: Reemplazar con consulta a base de datos
    const patients = [];

    res.json({ success: true, data: patients });
});

/**
 * GET /api/patients/:id
 * Obtener un paciente por ID
 */
router.get('/patients/:id', (req, res) => {
    const { id } = req.params;

    // TODO: Buscar en base de datos
    res.status(404).json({
        success: false,
        error: 'Paciente no encontrado'
    });
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
        id: Date.now(),
        name,
        age,
        email,
        createdAt: new Date().toISOString()
    };

    res.status(201).json({
        success: true,
        message: 'Paciente creado exitosamente',
        data: newPatient
    });
});

/**
 * PUT /api/patients/:id
 * Actualizar un paciente
 */
router.put('/patients/:id', (req, res) => {
    const { id } = req.params;
    const { name, age, email } = req.body;

    // TODO: Actualizar en base de datos
    res.json({
        success: true,
        message: 'Paciente actualizado',
        data: { id, name, age, email }
    });
});

/**
 * DELETE /api/patients/:id
 * Eliminar un paciente
 */
router.delete('/patients/:id', (req, res) => {
    const { id } = req.params;

    // TODO: Eliminar de base de datos
    res.json({
        success: true,
        message: 'Paciente eliminado'
    });
});

// ========================================
// SESIONES
// ========================================

/**
 * GET /api/sessions
 * Obtener todas las sesiones de terapia
 */
router.get('/sessions', (req, res) => {
    // TODO: Reemplazar con consulta a base de datos
    const sessions = [];

    res.json({ success: true, data: sessions });
});

/**
 * POST /api/sessions
 * Crear una nueva sesión
 * 
 * Body esperado: { patientId: number, date: string, notes: string }
 */
router.post('/sessions', (req, res) => {
    const { patientId, date, notes } = req.body;

    if (!patientId || !date) {
        return res.status(400).json({
            success: false,
            error: 'patientId y date son requeridos'
        });
    }

    // TODO: Guardar en base de datos
    const newSession = {
        id: Date.now(),
        patientId,
        date,
        notes,
        createdAt: new Date().toISOString()
    };

    res.status(201).json({
        success: true,
        message: 'Sesión creada exitosamente',
        data: newSession
    });
});

// ========================================
// AGREGA TUS NUEVAS RUTAS AQUÍ
// ========================================

module.exports = router;
