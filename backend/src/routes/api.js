/**
 * ========================================
 * RUTAS DE LA API - SUPABASE SDK
 * ========================================
 * 
 * Todas las consultas usan Supabase SDK exclusivamente.
 * NO se usa pg Pool.
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken, requireTerapeuta, requireSuperAdmin, optionalAuth } = require('../middleware/authMiddleware');
const { auditFromRequest, AUDIT_TYPES } = require('../utils/auditHelper');
const { validatePatient, validatePatientAssign } = require('../validators/patientValidator');

// ========================================
// ESTADO DE LA API
// ========================================

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Estado de la API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API funcionando correctamente
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        version: '1.0.0',
        database: 'Supabase PostgreSQL'
    });
});

/**
 * @swagger
 * /api/db-status:
 *   get:
 *     summary: Verificar conexión a base de datos
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Conexión exitosa
 *       500:
 *         description: Error de conexión
 */
router.get('/db-status', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id')
            .limit(1);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Conexión a Supabase exitosa',
            data: {
                currentTime: new Date().toISOString(),
                database: 'Supabase PostgreSQL'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error conectando a Supabase',
            details: error.message
        });
    }
});

// ========================================
// PACIENTES
// ========================================

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Obtener lista de pacientes
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     description: RF-SEG-03 - Los terapeutas solo ven sus pacientes asignados.
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado (true/false)
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Buscar por nombre (parcial)
 *       - in: query
 *         name: identificacion
 *         schema:
 *           type: string
 *         description: Buscar por identificación (parcial)
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *       401:
 *         description: No autenticado
 */
router.get('/patients', authenticateToken, requireTerapeuta, async (req, res) => {
    const { activo, nombre, identificacion } = req.query;

    try {
        // Para terapeutas, primero obtener sus pacientes asignados
        let patientIds = null;
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            const { data: assignments, error: assignError } = await supabase
                .from('terapeuta_paciente')
                .select('id_paciente')
                .eq('id_terapeuta', req.user.id_terapeuta);

            if (assignError) throw assignError;
            patientIds = assignments.map(a => a.id_paciente);

            // Si no tiene pacientes, devolver array vacío
            if (patientIds.length === 0) {
                return res.json({ success: true, data: [] });
            }
        }

        // Construir query de pacientes
        let query = supabase
            .from('pacientes')
            .select('*')
            .order('fecha_registro', { ascending: false });

        // Filtrar por pacientes asignados si es terapeuta
        if (patientIds) {
            query = query.in('id', patientIds);
        }

        // Filtro por estado activo
        if (activo !== undefined) {
            query = query.eq('activo', activo === 'true');
        }

        // Filtro por nombre
        if (nombre) {
            query = query.ilike('nombre', `%${nombre}%`);
        }

        // Filtro por documento de identificación (búsqueda exacta o parcial)
        if (identificacion) {
            query = query.ilike('identificacion', `%${identificacion}%`);
        }

        const { data: patients, error } = await query;
        if (error) throw error;

        // Obtener asignaciones de terapeutas
        const { data: allAssignments, error: assigError } = await supabase
            .from('terapeuta_paciente')
            .select('id_paciente, id_terapeuta, terapeutas(nombre)');

        if (assigError) throw assigError;

        // Mapear terapeutas a pacientes
        const patientsWithTherapist = patients.map(p => {
            const assignment = allAssignments.find(a => a.id_paciente === p.id);
            return {
                ...p,
                id_terapeuta: assignment?.id_terapeuta || null,
                terapeuta_nombre: assignment?.terapeutas?.nombre || null
            };
        });

        res.json({ success: true, data: patientsWithTherapist });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Obtener un paciente por ID
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Datos del paciente
 *       403:
 *         description: Sin acceso a este paciente
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/patients/:id', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id } = req.params;

    try {
        // Obtener paciente
        const { data: patient, error } = await supabase
            .from('pacientes')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !patient) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        // Verificar acceso para terapeutas
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            const { data: assignment } = await supabase
                .from('terapeuta_paciente')
                .select('id_terapeuta')
                .eq('id_paciente', id)
                .eq('id_terapeuta', req.user.id_terapeuta)
                .single();

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    error: 'Sin acceso a este paciente'
                });
            }
        }

        // Obtener terapeuta asignado
        const { data: assignment } = await supabase
            .from('terapeuta_paciente')
            .select('id_terapeuta, terapeutas(nombre)')
            .eq('id_paciente', id)
            .single();

        res.json({
            success: true,
            data: {
                ...patient,
                id_terapeuta: assignment?.id_terapeuta || null,
                terapeuta_nombre: assignment?.terapeutas?.nombre || null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Crear un nuevo paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               identificacion:
 *                 type: string
 *                 example: "1234567890"
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               edad:
 *                 type: integer
 *                 example: 65
 *               diagnostico:
 *                 type: string
 *                 example: "Deterioro cognitivo leve"
 *     responses:
 *       201:
 *         description: Paciente creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post('/patients', authenticateToken, requireTerapeuta, validatePatient, async (req, res) => {
    const { identificacion, nombre, edad, diagnostico } = req.body;

    if (!nombre) {
        return res.status(400).json({
            success: false,
            error: 'El nombre es requerido'
        });
    }

    try {
        // Crear paciente
        const { data: newPatient, error } = await supabase
            .from('pacientes')
            .insert({
                identificacion,
                nombre,
                edad,
                diagnostico,
                activo: true
            })
            .select()
            .single();

        if (error) throw error;

        // RF-SEG-03: Si es terapeuta, asignar automáticamente (con validación estricta de estado)
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            // Validar que el terapeuta esté realmente activo en DB (por si fue desactivado recientemente)
            const { data: userStatus } = await supabase
                .from('usuarios')
                .select('activo')
                .eq('id', req.user.id)
                .single();

            if (!userStatus?.activo) {
                // Si está desactivado, no le asignamos el paciente (y quizás deberíamos fallar todo el request, pero para no romper UX de creación...)
                // El requerimiento dice "no asignar".
                console.warn(`[Seguridad] Terapeuta ${req.user.id} intentó crear paciente estando inactivo through ID assignment.`);
                // Opcional: Lanzar error para impedir la creación del paciente
                throw new Error('Su cuenta usuario está desactivada. No puede asignar pacientes.');
            }

            await supabase
                .from('terapeuta_paciente')
                .insert({
                    id_terapeuta: req.user.id_terapeuta,
                    id_paciente: newPatient.id
                });
        }

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.PATIENT_CREATED, {
            id_paciente: newPatient.id,
            nombre: newPatient.nombre,
            terapeuta_asignado: req.user.id_terapeuta || null
        });

        res.status(201).json({
            success: true,
            message: 'Paciente creado exitosamente',
            data: newPatient
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Actualizar un paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identificacion:
 *                 type: string
 *               nombre:
 *                 type: string
 *               edad:
 *                 type: integer
 *               diagnostico:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Paciente actualizado
 *       404:
 *         description: Paciente no encontrado
 */
router.put('/patients/:id', authenticateToken, requireTerapeuta, validatePatient, async (req, res) => {
    const { id } = req.params;
    const { identificacion, nombre, edad, diagnostico, activo } = req.body;

    try {
        // F8: Verificar acceso del terapeuta al paciente
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            const { data: assignment } = await supabase
                .from('terapeuta_paciente')
                .select('id_terapeuta')
                .eq('id_paciente', id)
                .eq('id_terapeuta', req.user.id_terapeuta)
                .single();

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    error: 'Sin acceso a este paciente'
                });
            }
        }

        const updateData = {};
        if (identificacion !== undefined) updateData.identificacion = identificacion;
        if (nombre !== undefined) updateData.nombre = nombre;
        if (edad !== undefined) updateData.edad = edad;
        if (diagnostico !== undefined) updateData.diagnostico = diagnostico;
        if (activo !== undefined) updateData.activo = activo;

        const { data: updated, error } = await supabase
            .from('pacientes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error || !updated) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        // Auditoría
        await auditFromRequest(req, AUDIT_TYPES.PATIENT_UPDATED, {
            id_paciente: id,
            cambios: updateData
        });

        res.json({
            success: true,
            message: 'Paciente actualizado',
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// [REMOVED] DELETE route - Hard delete is not allowed. Use deactivation.

/**
 * @swagger
 * /api/patients/{id}/toggle-status:
 *   put:
 *     summary: Activar/desactivar paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       404:
 *         description: Paciente no encontrado
 */
router.put('/patients/:id/toggle-status', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id } = req.params;

    try {
        // F9: Verificar acceso del terapeuta al paciente
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            const { data: assignment } = await supabase
                .from('terapeuta_paciente')
                .select('id_terapeuta')
                .eq('id_paciente', id)
                .eq('id_terapeuta', req.user.id_terapeuta)
                .single();

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    error: 'Sin acceso a este paciente'
                });
            }
        }

        // Obtener estado actual
        const { data: patient, error: fetchError } = await supabase
            .from('pacientes')
            .select('activo, nombre')
            .eq('id', id)
            .single();

        if (fetchError || !patient) {
            return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
        }

        const newState = !patient.activo;

        // Actualizar estado
        const { data: updated, error: updateError } = await supabase
            .from('pacientes')
            .update({ activo: newState })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Auditoría
        await auditFromRequest(req, newState ? AUDIT_TYPES.PATIENT_UPDATED : AUDIT_TYPES.PATIENT_DELETED, {
            id_paciente: id,
            nombre: patient.nombre,
            accion: newState ? 'reactivado' : 'desactivado'
        });

        res.json({
            success: true,
            message: `Paciente ${newState ? 'activado' : 'desactivado'} exitosamente`,
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/patients/{id}/assign:
 *   post:
 *     summary: Asignar paciente a terapeuta (solo Superadmin)
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_terapeuta]
 *             properties:
 *               id_terapeuta:
 *                 type: integer
 *                 example: 1
 *                 description: ID del terapeuta a asignar
 *     responses:
 *       200:
 *         description: Paciente asignado
 *       400:
 *         description: Terapeuta inactivo o dato inválido
 *       404:
 *         description: Paciente o terapeuta no encontrado
 */
router.post('/patients/:id/assign', authenticateToken, requireSuperAdmin, validatePatientAssign, async (req, res) => {
    const { id } = req.params;
    const { id_terapeuta } = req.body;

    if (!id_terapeuta) {
        return res.status(400).json({
            success: false,
            error: 'id_terapeuta es requerido'
        });
    }

    try {
        // Verificar que el paciente existe
        const { data: patient, error: patientError } = await supabase
            .from('pacientes')
            .select('id, nombre')
            .eq('id', id)
            .single();

        if (patientError || !patient) {
            return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
        }

        // Verificar que el terapeuta existe y está activo
        const { data: therapist, error: therapistError } = await supabase
            .from('terapeutas')
            .select('id, nombre, id_usuario, usuarios(activo)')
            .eq('id', id_terapeuta)
            .single();

        if (therapistError || !therapist) {
            return res.status(404).json({ success: false, error: 'Terapeuta no encontrado' });
        }

        if (!therapist.usuarios?.activo) {
            return res.status(400).json({
                success: false,
                error: 'No se puede asignar a un terapeuta inactivo'
            });
        }

        // Obtener asignación anterior
        const { data: prevAssign } = await supabase
            .from('terapeuta_paciente')
            .select('id_terapeuta')
            .eq('id_paciente', id)
            .single();

        const prevTerapeuta = prevAssign?.id_terapeuta || null;

        // Eliminar asignación anterior
        await supabase
            .from('terapeuta_paciente')
            .delete()
            .eq('id_paciente', id);

        // Crear nueva asignación
        await supabase
            .from('terapeuta_paciente')
            .insert({ id_terapeuta, id_paciente: parseInt(id) });

        // Auditoría
        const auditType = prevTerapeuta ? AUDIT_TYPES.PATIENT_REASSIGNED : AUDIT_TYPES.PATIENT_ASSIGNED;
        await auditFromRequest(req, auditType, {
            id_paciente: id,
            paciente_nombre: patient.nombre,
            terapeuta_anterior: prevTerapeuta,
            terapeuta_nuevo: id_terapeuta,
            terapeuta_nombre: therapist.nombre
        });

        res.json({
            success: true,
            message: prevTerapeuta
                ? `Paciente reasignado a ${therapist.nombre}`
                : `Paciente asignado a ${therapist.nombre}`,
            data: {
                id_paciente: parseInt(id),
                id_terapeuta: id_terapeuta,
                terapeuta_nombre: therapist.nombre
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// SESIONES VR - Endpoints del Dashboard
// ========================================

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Listar sesiones VR para el dashboard
 *     tags: [Sesiones VR]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Lista las sesiones VR desde vr_session_results.
 *       Permite filtrar por estado de revisión y por paciente.
 *     parameters:
 *       - in: query
 *         name: estado_revision
 *         schema:
 *           type: string
 *           enum: [PENDIENTE_REVISION, REVISADA]
 *         description: Filtrar por estado de revisión
 *       - in: query
 *         name: pendientes
 *         schema:
 *           type: boolean
 *         description: Si es true, muestra solo las que tienen id_paciente_vinculado en NULL
 *       - in: query
 *         name: id_paciente
 *         schema:
 *           type: integer
 *         description: Filtrar por paciente vinculado
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Lista de sesiones VR
 */
router.get('/sessions', authenticateToken, requireTerapeuta, async (req, res) => {
    const { estado_revision, pendientes, id_paciente, limit = 50 } = req.query;

    try {
        // F7: Filtrar por pacientes asignados si es TERAPEUTA
        let allowedPatientIds = null;
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            const { data: assignments } = await supabase
                .from('terapeuta_paciente')
                .select('id_paciente')
                .eq('id_terapeuta', req.user.id_terapeuta);
            allowedPatientIds = (assignments || []).map(a => a.id_paciente);
        }

        let query = supabase
            .from('vr_session_results')
            .select(`
                id,
                participant_id,
                activity_id,
                started_at,
                ended_at,
                total_seconds,
                summary_total_errors,
                summary_total_drops,
                summary_total_releases,
                summary_sets_completed,
                id_paciente_vinculado,
                id_terapeuta_revisor,
                observaciones_terapeuta,
                estado_revision,
                created_at
            `)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        // TERAPEUTA: solo sesiones de sus pacientes asignados
        if (allowedPatientIds !== null) {
            // Si no tiene pacientes asignados, devolver lista vacía directamente
            if (allowedPatientIds.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    count: 0
                });
            }
            query = query.in('id_paciente_vinculado', allowedPatientIds);
        }

        // Filtrar por estado de revisión
        if (estado_revision) {
            query = query.eq('estado_revision', estado_revision);
        }

        // Filtrar pendientes (sin paciente vinculado)
        if (pendientes === 'true') {
            query = query.is('id_paciente_vinculado', null);
        }

        // Filtrar por paciente específico
        if (id_paciente) {
            query = query.eq('id_paciente_vinculado', parseInt(id_paciente));
        }

        const { data: sessions, error } = await query;
        if (error) throw error;

        // Obtener nombres de pacientes vinculados si existen
        const sessionsWithPatients = await Promise.all(
            sessions.map(async (session) => {
                let paciente_nombre = null;
                if (session.id_paciente_vinculado) {
                    const { data: patient } = await supabase
                        .from('pacientes')
                        .select('nombre')
                        .eq('id', session.id_paciente_vinculado)
                        .single();
                    paciente_nombre = patient?.nombre || null;
                }
                return {
                    ...session,
                    paciente_nombre
                };
            })
        );

        res.json({
            success: true,
            data: sessionsWithPatients,
            count: sessionsWithPatients.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sessions/{id}:
 *   put:
 *     summary: Actualizar sesión VR (Evaluación, Observaciones y Asignación)
 *     tags: [Sesiones VR]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Permite al terapeuta agregar evaluación del desempeño, observaciones clínicas
 *       y, si es necesario, corregir o asignar manualmente el paciente vinculado.
 *       
 *       **Seguridad:**
 *       - Requiere JWT válido con rol TERAPEUTA o SUPERADMIN
 *       - Validación de formato UUID en el parámetro id
 *       - Ownership check: TERAPEUTA solo puede actualizar sesiones de sus pacientes asignados
 *       - SUPERADMIN puede actualizar cualquier sesión
 *       - Validación de longitud máxima en observaciones (2000 caracteres)
 *       - Verificación de existencia de la sesión antes de actualizar
 *       - Registro de auditoría (SESSION_REVIEWED)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de la sesión VR
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observaciones:
 *                 type: string
 *                 maxLength: 2000
 *                 description: |
 *                   Observaciones clínicas del terapeuta. Puede incluir prefijo de evaluación
 *                   del desempeño en formato `[Calificación: X/5 - Label]` seguido de las observaciones.
 *                 example: "[Calificación: 4/5 - Bueno]\nPaciente mostró mejoría en tiempo de reacción."
 *               id_paciente:
 *                 type: integer
 *                 description: ID del paciente para vinculación manual (opcional, para correcciones)
 *                 example: 14
 *     responses:
 *       200:
 *         description: Sesión actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VRSessionResult'
 *       400:
 *         description: Validación fallida (UUID inválido, observaciones demasiado largas, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token de autenticación requerido o inválido
 *       403:
 *         description: Sin acceso a esta sesión (TERAPEUTA no asignado al paciente)
 *       404:
 *         description: Sesión VR no encontrada o paciente no encontrado
 */
router.put('/sessions/:id', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id } = req.params;
    const { observaciones, id_paciente } = req.body;

    try {
        // ── Validación de formato UUID ──
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({
                success: false,
                error: 'El ID de sesión debe ser un UUID válido',
                code: 'INVALID_UUID'
            });
        }

        // ── Validación de inputs ──
        if (observaciones !== undefined) {
            if (typeof observaciones !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Las observaciones deben ser texto',
                    code: 'INVALID_INPUT'
                });
            }
            if (observaciones.length > 2000) {
                return res.status(400).json({
                    success: false,
                    error: 'Las observaciones no pueden exceder 2000 caracteres',
                    code: 'INPUT_TOO_LONG'
                });
            }
        }

        if (id_paciente !== undefined && id_paciente !== null) {
            if (!Number.isInteger(id_paciente) || id_paciente <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El ID del paciente debe ser un número entero positivo',
                    code: 'INVALID_INPUT'
                });
            }
        }

        // ── Verificar que la sesión existe ──
        const { data: session, error: sessionError } = await supabase
            .from('vr_session_results')
            .select('id, id_paciente_vinculado, participant_id')
            .eq('id', id)
            .single();

        if (sessionError || !session) {
            return res.status(404).json({
                success: false,
                error: 'Sesión VR no encontrada',
                code: 'SESSION_NOT_FOUND'
            });
        }

        // ── Ownership check: TERAPEUTA solo puede editar sesiones de sus pacientes ──
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            if (session.id_paciente_vinculado) {
                const { data: assignment } = await supabase
                    .from('terapeuta_paciente')
                    .select('id_terapeuta')
                    .eq('id_paciente', session.id_paciente_vinculado)
                    .eq('id_terapeuta', req.user.id_terapeuta)
                    .single();

                if (!assignment) {
                    return res.status(403).json({
                        success: false,
                        error: 'Sin acceso a esta sesión. El paciente no está asignado a usted.',
                        code: 'ACCESS_DENIED'
                    });
                }
            }
            // Si la sesión no tiene paciente vinculado, cualquier terapeuta puede revisarla
        }

        // ── Construir datos de actualización ──
        const updateData = {
            id_terapeuta_revisor: req.user.id_terapeuta,
            estado_revision: 'REVISADA'
        };

        if (observaciones !== undefined) {
            updateData.observaciones_terapeuta = observaciones;
        }

        if (id_paciente) {
            // Verificar que el paciente exista y esté activo
            const { data: patient, error: pError } = await supabase
                .from('pacientes')
                .select('id, nombre')
                .eq('id', id_paciente)
                .eq('activo', true)
                .single();

            if (pError || !patient) {
                return res.status(404).json({
                    success: false,
                    error: 'Paciente no encontrado o inactivo',
                    code: 'PATIENT_NOT_FOUND'
                });
            }

            // Si es TERAPEUTA, verificar que el paciente le esté asignado
            if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
                const { data: patientAssignment } = await supabase
                    .from('terapeuta_paciente')
                    .select('id_terapeuta')
                    .eq('id_paciente', id_paciente)
                    .eq('id_terapeuta', req.user.id_terapeuta)
                    .single();

                if (!patientAssignment) {
                    return res.status(403).json({
                        success: false,
                        error: 'No puede vincular un paciente que no le está asignado',
                        code: 'ACCESS_DENIED'
                    });
                }
            }

            updateData.id_paciente_vinculado = id_paciente;
        }

        // ── Ejecutar actualización ──
        const { data: updated, error } = await supabase
            .from('vr_session_results')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // ── Registrar auditoría ──
        await auditFromRequest(req, AUDIT_TYPES.SESSION_REVIEWED, {
            session_id: id,
            participant_id: session.participant_id,
            id_paciente_vinculado: updated.id_paciente_vinculado,
            tiene_evaluacion: observaciones ? observaciones.startsWith('[Calificación:') : false
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// INFORME DE PACIENTE
// ========================================

/**
 * @swagger
 * /api/patients/{id}/report:
 *   get:
 *     summary: Obtener informe completo de un paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Informe con estadísticas y sesiones
 *       403:
 *         description: Sin acceso a este paciente
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/patients/:id/report', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id } = req.params;

    try {
        // Obtener paciente
        const { data: patient, error: patientError } = await supabase
            .from('pacientes')
            .select('*')
            .eq('id', id)
            .single();

        if (patientError || !patient) {
            return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
        }

        // Verificar acceso para terapeutas
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            const { data: assignment } = await supabase
                .from('terapeuta_paciente')
                .select('id_terapeuta')
                .eq('id_paciente', id)
                .eq('id_terapeuta', req.user.id_terapeuta)
                .single();

            if (!assignment) {
                return res.status(403).json({ success: false, error: 'Sin acceso a este paciente' });
            }
        }

        // Obtener terapeuta asignado
        const { data: therapistAssign } = await supabase
            .from('terapeuta_paciente')
            .select('terapeutas(id, nombre)')
            .eq('id_paciente', id)
            .single();

        // Obtener sesiones desde la nueva tabla vr_session_results
        const { data: sessions, error: sessionsError } = await supabase
            .from('vr_session_results')
            .select(`
                id,
                started_at,
                ended_at,
                activity_id,
                total_seconds,
                summary_total_errors,
                summary_total_drops,
                summary_total_releases,
                observaciones_terapeuta,
                estado_revision
            `)
            .eq('id_paciente_vinculado', id)
            .order('started_at', { ascending: false });

        if (sessionsError) throw sessionsError;

        // Formatear sesiones
        const formattedSessions = sessions.map(s => ({
            id: s.id,
            actividad: s.activity_id, // Usamos activity_id como nombre de actividad por ahora
            fecha_inicio: s.started_at,
            fecha_fin: s.ended_at,
            estado: s.estado_revision, // Usamos estado_revision como estado
            total_aciertos: s.summary_total_releases, // Asumiendo releases como "aciertos" o completados
            total_errores: s.summary_total_errors,
            total_drops: s.summary_total_drops,
            tiempo_total_seg: s.total_seconds,
            observaciones: s.observaciones_terapeuta
        }));

        // Calcular estadísticas
        const stats = {
            total_sesiones: formattedSessions.length,
            sesiones_completadas: formattedSessions.length, // Todas las que llegan aquí se asumen completadas o intentadas
            total_aciertos: formattedSessions.reduce((sum, s) => sum + s.total_aciertos, 0),
            total_errores: formattedSessions.reduce((sum, s) => sum + s.total_errores, 0),
            total_drops: formattedSessions.reduce((sum, s) => sum + s.total_drops, 0),
            tiempo_total_minutos: Math.round(formattedSessions.reduce((sum, s) => sum + s.tiempo_total_seg, 0) / 60)
        };

        res.json({
            success: true,
            data: {
                patient: {
                    ...patient,
                    id_terapeuta: therapistAssign?.terapeutas?.id,
                    terapeuta_nombre: therapistAssign?.terapeutas?.nombre
                },
                stats,
                sessions: formattedSessions
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// TERAPEUTAS
// ========================================

/**
 * @swagger
 * /api/terapeutas:
 *   get:
 *     summary: Obtener todos los terapeutas
 *     tags: [Terapeutas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de terapeutas con estado
 */
router.get('/terapeutas', authenticateToken, requireTerapeuta, async (req, res) => {
    try {
        const { data: therapists, error } = await supabase
            .from('terapeutas')
            .select(`
                id,
                nombre,
                especialidad,
                correo,
                telefono,
                id_usuario,
                usuarios(email, activo)
            `)
            .order('nombre');

        if (error) throw error;

        const formatted = therapists.map(t => ({
            id: t.id,
            nombre: t.nombre,
            especialidad: t.especialidad,
            correo: t.correo,
            telefono: t.telefono,
            email: t.usuarios?.email,
            activo: t.usuarios?.activo
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// ========================================
// ESTADÍSTICAS / DASHBOARD
// ========================================

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas generales
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Estadísticas del sistema incluyendo pacientes, terapeutas,
 *       sesiones VR (desde vr_session_results) y actividades disponibles.
 *     responses:
 *       200:
 *         description: Estadísticas del sistema y sesiones recientes
 */
router.get('/dashboard/stats', authenticateToken, requireTerapeuta, async (req, res) => {
    try {
        // Contar pacientes
        const { count: totalPacientes } = await supabase
            .from('pacientes')
            .select('id', { count: 'exact', head: true });

        // Contar sesiones VR (usando tabla real)
        const { count: totalSesiones } = await supabase
            .from('vr_session_results')
            .select('id', { count: 'exact', head: true });

        // Contar terapeutas
        const { count: totalTerapeutas } = await supabase
            .from('terapeutas')
            .select('id', { count: 'exact', head: true });

        // Contar actividades únicas desde sesiones VR
        const { data: uniqueActivities } = await supabase
            .from('vr_session_results')
            .select('activity_id');
        const totalActividades = uniqueActivities
            ? new Set(uniqueActivities.map(a => a.activity_id)).size
            : 0;

        // Sesiones VR recientes
        const { data: recentSessions } = await supabase
            .from('vr_session_results')
            .select('id, activity_id, participant_id, started_at, total_seconds, summary_total_errors')
            .order('created_at', { ascending: false })
            .limit(5);

        res.json({
            success: true,
            data: {
                stats: {
                    total_pacientes: totalPacientes || 0,
                    total_sesiones_vr: totalSesiones || 0,
                    total_terapeutas: totalTerapeutas || 0,
                    total_actividades: totalActividades
                },
                recentSessions: recentSessions?.map(s => ({
                    id: s.id,
                    activity_id: s.activity_id,
                    participant_id: s.participant_id,
                    fecha_inicio: s.started_at,
                    duracion_seg: s.total_seconds,
                    errores: s.summary_total_errors
                })) || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
