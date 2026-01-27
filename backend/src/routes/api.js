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
 */
router.get('/patients', authenticateToken, requireTerapeuta, async (req, res) => {
    const { activo, nombre } = req.query;

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
 */
router.put('/patients/:id', authenticateToken, requireTerapeuta, validatePatient, async (req, res) => {
    const { id } = req.params;
    const { identificacion, nombre, edad, diagnostico, activo } = req.body;

    try {
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
 */
router.put('/patients/:id/toggle-status', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id } = req.params;

    try {
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
// SESIONES
// ========================================

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Obtener sesiones de terapia
 *     tags: [Sesiones]
 */
router.get('/sessions', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id_paciente, estado, limit = 50 } = req.query;

    try {
        // Para terapeutas, obtener IDs de pacientes asignados
        let patientIds = null;
        if (req.user.rol === 'TERAPEUTA' && req.user.id_terapeuta) {
            const { data: assignments } = await supabase
                .from('terapeuta_paciente')
                .select('id_paciente')
                .eq('id_terapeuta', req.user.id_terapeuta);

            patientIds = assignments?.map(a => a.id_paciente) || [];
            if (patientIds.length === 0) {
                return res.json({ success: true, data: [] });
            }
        }

        let query = supabase
            .from('sesiones')
            .select(`
                *,
                pacientes(nombre),
                actividad_juego(nombre, nivel_dificultad),
                resumen_sesion(total_aciertos, total_errores, total_omisiones, tiempo_total_seg, observaciones)
            `)
            .order('fecha_inicio', { ascending: false })
            .limit(parseInt(limit));

        if (patientIds) {
            query = query.in('id_paciente', patientIds);
        }

        if (id_paciente) {
            query = query.eq('id_paciente', parseInt(id_paciente));
        }

        if (estado) {
            query = query.eq('estado', estado);
        }

        const { data: sessions, error } = await query;
        if (error) throw error;

        // Reformatear datos
        const formattedSessions = sessions.map(s => ({
            id: s.id,
            id_paciente: s.id_paciente,
            paciente_nombre: s.pacientes?.nombre,
            id_actividad: s.id_actividad,
            actividad_nombre: s.actividad_juego?.nombre,
            nivel_dificultad: s.actividad_juego?.nivel_dificultad,
            fecha_inicio: s.fecha_inicio,
            fecha_fin: s.fecha_fin,
            estado: s.estado,
            num_pausas: s.num_pausas,
            num_alertas_descanso: s.num_alertas_descanso,
            total_aciertos: s.resumen_sesion?.total_aciertos,
            total_errores: s.resumen_sesion?.total_errores,
            total_omisiones: s.resumen_sesion?.total_omisiones,
            tiempo_total_seg: s.resumen_sesion?.tiempo_total_seg,
            observaciones: s.resumen_sesion?.observaciones
        }));

        res.json({ success: true, data: formattedSessions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Obtener una sesión con eventos detallados
 *     tags: [Sesiones]
 */
router.get('/sessions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data: session, error: sessionError } = await supabase
            .from('sesiones')
            .select(`
                *,
                pacientes(nombre, diagnostico),
                actividad_juego(nombre, nivel_dificultad, tiempo_max_seg),
                resumen_sesion(total_aciertos, total_errores, tiempo_total_seg, observaciones)
            `)
            .eq('id', id)
            .single();

        if (sessionError || !session) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada'
            });
        }

        const { data: events, error: eventsError } = await supabase
            .from('eventos_interacciones')
            .select(`
                *,
                evaluacion_cognitiva(clasificacion, puntaje)
            `)
            .eq('id_sesion', id)
            .order('timestamp_evento', { ascending: true });

        if (eventsError) throw eventsError;

        res.json({
            success: true,
            data: {
                session: {
                    ...session,
                    paciente_nombre: session.pacientes?.nombre,
                    paciente_diagnostico: session.pacientes?.diagnostico,
                    actividad_nombre: session.actividad_juego?.nombre,
                    nivel_dificultad: session.actividad_juego?.nivel_dificultad,
                    tiempo_max_seg: session.actividad_juego?.tiempo_max_seg,
                    total_aciertos: session.resumen_sesion?.total_aciertos,
                    total_errores: session.resumen_sesion?.total_errores,
                    tiempo_total_seg: session.resumen_sesion?.tiempo_total_seg,
                    observaciones: session.resumen_sesion?.observaciones
                },
                events: events.map(e => ({
                    ...e,
                    clasificacion: e.evaluacion_cognitiva?.clasificacion,
                    puntaje: e.evaluacion_cognitiva?.puntaje
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Crear una nueva sesión
 *     tags: [Sesiones]
 */
router.post('/sessions', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id_paciente, id_actividad } = req.body;

    if (!id_paciente || !id_actividad) {
        return res.status(400).json({
            success: false,
            error: 'id_paciente y id_actividad son requeridos'
        });
    }

    try {
        const { data: newSession, error } = await supabase
            .from('sesiones')
            .insert({
                id_paciente,
                id_actividad,
                estado: 'INICIADA',
                fecha_inicio: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        await auditFromRequest(req, AUDIT_TYPES.SESSION_STARTED, {
            id_sesion: newSession.id,
            id_paciente,
            id_actividad
        });

        res.status(201).json({
            success: true,
            message: 'Sesión creada exitosamente',
            data: newSession
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sessions/{id}/finish:
 *   put:
 *     summary: Finalizar una sesión
 *     tags: [Sesiones]
 */
router.put('/sessions/:id/finish', authenticateToken, requireTerapeuta, async (req, res) => {
    const { id } = req.params;
    const {
        estado = 'COMPLETADA',
        total_aciertos = 0,
        total_errores = 0,
        total_omisiones = 0,
        tiempo_total_seg,
        observaciones,
        num_pausas = 0,
        num_alertas_descanso = 0
    } = req.body;

    try {
        // Actualizar sesión
        const { data: updated, error: updateError } = await supabase
            .from('sesiones')
            .update({
                fecha_fin: new Date().toISOString(),
                estado,
                num_pausas,
                num_alertas_descanso
            })
            .eq('id', id)
            .eq('estado', 'INICIADA')
            .select()
            .single();

        if (updateError || !updated) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada o ya finalizada'
            });
        }

        // Crear o actualizar resumen
        await supabase
            .from('resumen_sesion')
            .upsert({
                id_sesion: parseInt(id),
                total_aciertos,
                total_errores,
                tiempo_total_seg,
                observaciones
            }, { onConflict: 'id_sesion' });

        const auditType = estado === 'COMPLETADA' ? AUDIT_TYPES.SESSION_FINISHED : AUDIT_TYPES.SESSION_ABANDONED;
        await auditFromRequest(req, auditType, {
            id_sesion: id,
            estado,
            total_aciertos,
            total_errores,
            total_omisiones
        });

        res.json({
            success: true,
            message: `Sesión ${estado.toLowerCase()}`,
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/sessions/{id}/events:
 *   post:
 *     summary: Registrar evento de interacción
 *     tags: [Sesiones]
 */
router.post('/sessions/:id/events', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        tipo_accion,
        objeto_id,
        objeto_descripcion,
        posicion_x,
        posicion_y,
        posicion_z,
        cantidad,
        metadatos,
        clasificacion
    } = req.body;

    if (!tipo_accion) {
        return res.status(400).json({
            success: false,
            error: 'tipo_accion es requerido'
        });
    }

    try {
        // Verificar sesión activa
        const { data: session } = await supabase
            .from('sesiones')
            .select('id')
            .eq('id', id)
            .eq('estado', 'INICIADA')
            .single();

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada o no está activa'
            });
        }

        // Insertar evento
        const { data: event, error: eventError } = await supabase
            .from('eventos_interacciones')
            .insert({
                id_sesion: parseInt(id),
                tipo_accion,
                objeto_id,
                objeto_descripcion,
                posicion_x,
                posicion_y,
                posicion_z,
                cantidad,
                metadatos: metadatos || {}
            })
            .select()
            .single();

        if (eventError) throw eventError;

        // Si hay clasificación, registrarla
        if (clasificacion) {
            await supabase
                .from('evaluacion_cognitiva')
                .insert({
                    id_evento: event.id,
                    clasificacion
                });
        }

        res.status(201).json({
            success: true,
            message: 'Evento registrado',
            data: event
        });
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

        // Obtener sesiones
        const { data: sessions, error: sessionsError } = await supabase
            .from('sesiones')
            .select(`
                id,
                fecha_inicio,
                fecha_fin,
                estado,
                actividad_juego(nombre, nivel_dificultad),
                resumen_sesion(total_aciertos, total_errores, tiempo_total_seg, observaciones)
            `)
            .eq('id_paciente', id)
            .order('fecha_inicio', { ascending: false });

        if (sessionsError) throw sessionsError;

        // Formatear sesiones
        const formattedSessions = sessions.map(s => ({
            id: s.id,
            actividad: s.actividad_juego?.nombre,
            nivel_dificultad: s.actividad_juego?.nivel_dificultad,
            fecha_inicio: s.fecha_inicio,
            fecha_fin: s.fecha_fin,
            estado: s.estado,
            total_aciertos: s.resumen_sesion?.total_aciertos || 0,
            total_errores: s.resumen_sesion?.total_errores || 0,
            // TODO: Descomentar cuando la columna exista en BD
            // total_omisiones: s.resumen_sesion?.total_omisiones || 0,
            total_omisiones: 0,
            tiempo_total_seg: s.resumen_sesion?.tiempo_total_seg || 0,
            observaciones: s.resumen_sesion?.observaciones
        }));

        // Calcular estadísticas
        const stats = {
            total_sesiones: formattedSessions.length,
            sesiones_completadas: formattedSessions.filter(s => s.estado === 'COMPLETADA').length,
            total_aciertos: formattedSessions.reduce((sum, s) => sum + s.total_aciertos, 0),
            total_errores: formattedSessions.reduce((sum, s) => sum + s.total_errores, 0),
            total_omisiones: formattedSessions.reduce((sum, s) => sum + s.total_omisiones, 0),
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
 */
router.get('/terapeutas', async (req, res) => {
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
// ACTIVIDADES
// ========================================

/**
 * @swagger
 * /api/actividades:
 *   get:
 *     summary: Obtener todas las actividades del juego
 *     tags: [Actividades]
 */
router.get('/actividades', async (req, res) => {
    try {
        const { data: activities, error } = await supabase
            .from('actividad_juego')
            .select('id, nombre, descripcion, nivel_dificultad, tiempo_max_seg, unity_id')
            .order('nivel_dificultad')
            .order('nombre');

        if (error) throw error;
        res.json({ success: true, data: activities });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/actividades/{id}:
 *   get:
 *     summary: Obtener actividad con ingredientes y utensilios
 *     tags: [Actividades]
 */
router.get('/actividades/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data: activity, error: actError } = await supabase
            .from('actividad_juego')
            .select('*')
            .eq('id', id)
            .single();

        if (actError || !activity) {
            return res.status(404).json({
                success: false,
                error: 'Actividad no encontrada'
            });
        }

        const { data: ingredients } = await supabase
            .from('ingrediente_actividad')
            .select('cantidad_requerida, ingrediente(*)')
            .eq('id_actividad', id);

        const { data: tools } = await supabase
            .from('utensilio_actividad')
            .select('utensilio(*)')
            .eq('id_actividad', id);

        const { data: actions } = await supabase
            .from('accion_actividad')
            .select('orden, accion(*)')
            .eq('id_actividad', id)
            .order('orden');

        res.json({
            success: true,
            data: {
                activity,
                ingredients: ingredients?.map(i => ({ ...i.ingrediente, cantidad_requerida: i.cantidad_requerida })) || [],
                tools: tools?.map(t => t.utensilio) || [],
                actions: actions?.map(a => ({ ...a.accion, orden: a.orden })) || []
            }
        });
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
 */
router.get('/dashboard/stats', async (req, res) => {
    try {
        // Contar pacientes
        const { count: totalPacientes } = await supabase
            .from('pacientes')
            .select('id', { count: 'exact', head: true });

        // Contar sesiones
        const { count: totalSesiones } = await supabase
            .from('sesiones')
            .select('id', { count: 'exact', head: true });

        // Contar sesiones completadas
        const { count: sesionesCompletadas } = await supabase
            .from('sesiones')
            .select('id', { count: 'exact', head: true })
            .eq('estado', 'COMPLETADA');

        // Contar terapeutas
        const { count: totalTerapeutas } = await supabase
            .from('terapeutas')
            .select('id', { count: 'exact', head: true });

        // Contar actividades
        const { count: totalActividades } = await supabase
            .from('actividad_juego')
            .select('id', { count: 'exact', head: true });

        // Sesiones recientes
        const { data: recentSessions } = await supabase
            .from('sesiones')
            .select(`
                id,
                estado,
                fecha_inicio,
                pacientes(nombre),
                actividad_juego(nombre)
            `)
            .order('fecha_inicio', { ascending: false })
            .limit(5);

        res.json({
            success: true,
            data: {
                stats: {
                    total_pacientes: totalPacientes || 0,
                    total_sesiones: totalSesiones || 0,
                    sesiones_completadas: sesionesCompletadas || 0,
                    total_terapeutas: totalTerapeutas || 0,
                    total_actividades: totalActividades || 0
                },
                recentSessions: recentSessions?.map(s => ({
                    id: s.id,
                    paciente: s.pacientes?.nombre,
                    actividad: s.actividad_juego?.nombre,
                    estado: s.estado,
                    fecha_inicio: s.fecha_inicio
                })) || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
