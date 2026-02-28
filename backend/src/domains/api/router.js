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
const { supabase } = require('../../config/supabase');
const { authenticateToken, requireTerapeuta, requireSuperAdmin } = require('../../middleware/authMiddleware');
const { auditFromRequest, AUDIT_TYPES } = require('../../utils/auditHelper');
const { validatePatient, validatePatientAssign } = require('../../validators/patientValidator');
const { buildCacheKey, getCachedJson, setCachedJson } = require('../../utils/cache');
const { invalidatePatientCaches } = require('../../utils/cacheInvalidation');
const {
    parsePagination,
    parseSearch,
    parseSort,
    applySortClauses,
    buildPaginationMetadata
} = require('../../utils/queryOptions');

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
        const { error } = await supabase
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
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
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
 *       - in: query
 *         name: id_terapeuta
 *         schema:
 *           type: integer
 *         description: Filtrar por terapeuta (uso Superadmin)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda textual global (nombre, identificación, diagnóstico)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Orden multi-criterio (ej. fecha_registro:desc,nombre:asc)
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *       401:
 *         description: No autenticado
 */
router.get('/patients', authenticateToken, requireTerapeuta, async (req, res) => {
    const { activo, nombre, identificacion, id_terapeuta: therapistFilter } = req.query;
    const pagination = parsePagination(req.query, {
        page: 1,
        limit: 25,
        maxLimit: 200
    });
    const search = parseSearch(req.query);
    const sortClauses = parseSort(
        req.query,
        ['fecha_registro', 'nombre', 'edad', 'identificacion', 'activo'],
        [{ field: 'fecha_registro', ascending: false }]
    );

    try {
        const cacheKey = buildCacheKey('api:patients:list', {
            role: req.user.rol,
            therapistId: req.user.id_terapeuta || null,
            activo: activo ?? null,
            nombre: nombre || null,
            identificacion: identificacion || null,
            search,
            id_terapeuta: therapistFilter || null,
            sort: sortClauses,
            page: pagination.page,
            limit: pagination.limit
        });

        const cachedPayload = await getCachedJson(cacheKey);
        if (cachedPayload) {
            return res.json(cachedPayload);
        }

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
                const payload = {
                    success: true,
                    data: [],
                    count: 0,
                    pagination: {
                        ...buildPaginationMetadata({
                            page: pagination.page,
                            limit: pagination.limit,
                            total: 0
                        })
                    }
                };
                await setCachedJson(cacheKey, payload, 20);
                return res.json(payload);
            }
        }

        if (therapistFilter) {
            const { data: assignmentsByTherapist, error: filterError } = await supabase
                .from('terapeuta_paciente')
                .select('id_paciente')
                .eq('id_terapeuta', therapistFilter);

            if (filterError) throw filterError;

            const filteredPatientIds = (assignmentsByTherapist || []).map((item) => item.id_paciente);

            if (patientIds) {
                const allowedSet = new Set(patientIds);
                patientIds = filteredPatientIds.filter((id) => allowedSet.has(id));
            } else {
                patientIds = filteredPatientIds;
            }

            if (patientIds.length === 0) {
                const payload = {
                    success: true,
                    data: [],
                    count: 0,
                    pagination: {
                        ...buildPaginationMetadata({
                            page: pagination.page,
                            limit: pagination.limit,
                            total: 0
                        })
                    }
                };
                await setCachedJson(cacheKey, payload, 20);
                return res.json(payload);
            }
        }

        // Construir query de pacientes
        let query = supabase
            .from('pacientes')
            .select('*', { count: 'exact' });

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

        if (search) {
            query = query.or(`nombre.ilike.%${search}%,identificacion.ilike.%${search}%,diagnostico.ilike.%${search}%`);
        }

        query = applySortClauses(query, sortClauses).range(pagination.from, pagination.to);

        const { data: patients, count: totalPatients, error } = await query;
        if (error) throw error;

        const patientIdsForPage = (patients || []).map((patient) => patient.id);
        if (patientIdsForPage.length === 0) {
            const total = totalPatients || 0;
            const payload = {
                success: true,
                data: [],
                count: 0,
                pagination: buildPaginationMetadata({
                    page: pagination.page,
                    limit: pagination.limit,
                    total
                })
            };
            await setCachedJson(cacheKey, payload, 20);
            return res.json(payload);
        }

        const { data: assignmentsByPage, error: pageAssignError } = await supabase
            .from('terapeuta_paciente')
            .select('id_paciente, id_terapeuta, terapeutas(nombre)')
            .in('id_paciente', patientIdsForPage);

        if (pageAssignError) throw pageAssignError;

        const assignmentsByPatientId = new Map(
            (assignmentsByPage || []).map((assignment) => [assignment.id_paciente, assignment])
        );

        // Mapear terapeutas a pacientes en O(n)
        const patientsWithTherapist = patients.map((patient) => {
            const assignment = assignmentsByPatientId.get(patient.id);
            return {
                ...patient,
                id_terapeuta: assignment?.id_terapeuta || null,
                terapeuta_nombre: assignment?.terapeutas?.nombre || null
            };
        });

        const total = totalPatients || 0;
        const payload = {
            success: true,
            data: patientsWithTherapist,
            count: patientsWithTherapist.length,
            pagination: buildPaginationMetadata({
                page: pagination.page,
                limit: pagination.limit,
                total
            })
        };
        await setCachedJson(cacheKey, payload, 20);
        res.json(payload);
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
        const cacheKey = buildCacheKey(`api:patients:detail:${id}`, {
            role: req.user.rol,
            therapistId: req.user.id_terapeuta || null
        });

        const cachedPayload = await getCachedJson(cacheKey);
        if (cachedPayload) {
            return res.json(cachedPayload);
        }

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

        const payload = {
            success: true,
            data: {
                ...patient,
                id_terapeuta: assignment?.id_terapeuta || null,
                terapeuta_nombre: assignment?.terapeutas?.nombre || null
            }
        };

        await setCachedJson(cacheKey, payload, 30);
        res.json(payload);
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

        await invalidatePatientCaches();

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

        await invalidatePatientCaches();

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

        await invalidatePatientCaches();

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

        await invalidatePatientCaches();

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

module.exports = router;
