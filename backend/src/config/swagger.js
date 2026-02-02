/**
 * ========================================
 * CONFIGURACIÓN DE SWAGGER
 * ========================================
 * 
 * Documentación interactiva de la API
 * Acceso: http://localhost:3001/api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Dashboard Terapeuta - API',
            version: '1.0.0',
            description: `
## API para el Dashboard de Terapeutas

Esta API proporciona endpoints para gestionar:
- **Pacientes**: CRUD completo de pacientes
- **Sesiones**: Registro y seguimiento de sesiones de terapia
- **Terapeutas**: Información de terapeutas
- **Actividades**: Actividades del juego terapéutico
- **Dashboard**: Estadísticas generales
- **VR Results**: Resultados de sesiones del videojuego Unity

### Base de Datos
Conectada a **Supabase PostgreSQL**
      `,
            contact: {
                name: 'Soporte',
                email: 'admin@clinica.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Servidor de Desarrollo'
            }
        ],
        tags: [
            { name: 'Health', description: 'Estado del servidor' },
            { name: 'Autenticación', description: 'Login, setup y sesión' },
            { name: 'Usuarios', description: 'Gestión de usuarios (solo Superadmin)' },
            { name: 'Pacientes', description: 'Gestión de pacientes' },
            { name: 'Sesiones', description: 'Sesiones de terapia' },
            { name: 'Terapeutas', description: 'Información de terapeutas' },
            { name: 'Actividades', description: 'Actividades del juego' },
            { name: 'Dashboard', description: 'Estadísticas generales' },
            { name: 'Auditoría', description: 'Eventos de auditoría (solo Superadmin)' },
            { name: 'VR Results', description: 'Resultados de sesiones VR (Unity)' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenido del endpoint /api/auth/login'
                }
            },
            schemas: {
                Paciente: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'ID único del paciente' },
                        identificacion: { type: 'string', description: 'Documento de identificación' },
                        nombre: { type: 'string', description: 'Nombre completo' },
                        edad: { type: 'integer', description: 'Edad del paciente' },
                        diagnostico: { type: 'string', description: 'Diagnóstico médico' },
                        fecha_registro: { type: 'string', format: 'date', description: 'Fecha de registro' }
                    }
                },
                PacienteInput: {
                    type: 'object',
                    required: ['nombre'],
                    properties: {
                        identificacion: { type: 'string', example: 'P006' },
                        nombre: { type: 'string', example: 'Nuevo Paciente' },
                        edad: { type: 'integer', example: 15 },
                        diagnostico: { type: 'string', example: 'Diagnóstico inicial' }
                    }
                },
                Sesion: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        id_paciente: { type: 'integer' },
                        paciente_nombre: { type: 'string' },
                        id_actividad: { type: 'integer' },
                        actividad_nombre: { type: 'string' },
                        fecha_inicio: { type: 'string', format: 'date-time' },
                        fecha_fin: { type: 'string', format: 'date-time' },
                        estado: { type: 'string', enum: ['COMPLETADA', 'ABANDONADA'] },
                        total_aciertos: { type: 'integer' },
                        total_errores: { type: 'integer' },
                        tiempo_total_seg: { type: 'integer' },
                        observaciones: { type: 'string' }
                    }
                },
                SesionInput: {
                    type: 'object',
                    required: ['id_paciente', 'id_actividad'],
                    properties: {
                        id_paciente: { type: 'integer', example: 1 },
                        id_actividad: { type: 'integer', example: 1 }
                    }
                },
                Terapeuta: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        nombre: { type: 'string' },
                        especialidad: { type: 'string' },
                        correo: { type: 'string' },
                        telefono: { type: 'string' },
                        email: { type: 'string' },
                        activo: { type: 'boolean' }
                    }
                },
                Actividad: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        nombre: { type: 'string' },
                        descripcion: { type: 'string' },
                        nivel_dificultad: { type: 'integer', minimum: 1, maximum: 5 },
                        tiempo_max_seg: { type: 'integer' },
                        unity_id: { type: 'string' }
                    }
                },
                DashboardStats: {
                    type: 'object',
                    properties: {
                        stats: {
                            type: 'object',
                            properties: {
                                total_pacientes: { type: 'integer' },
                                total_sesiones: { type: 'integer' },
                                sesiones_completadas: { type: 'integer' },
                                total_terapeutas: { type: 'integer' },
                                total_actividades: { type: 'integer' }
                            }
                        },
                        recentSessions: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Sesion' }
                        }
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string' }
                    }
                },
                VRSessionResult: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        schema_version: { type: 'string', example: '1.0' },
                        participant_id: { type: 'string' },
                        activity_id: { type: 'string', example: 'tinto_easy_01' },
                        started_at: { type: 'string', format: 'date-time' },
                        ended_at: { type: 'string', format: 'date-time' },
                        total_seconds: { type: 'number' },
                        summary_total_errors: { type: 'integer' },
                        summary_total_drops: { type: 'integer' },
                        summary_total_releases: { type: 'integer' },
                        summary_sets_completed: { type: 'integer' },
                        raw_payload: { type: 'object' }
                    }
                },
                VRSessionInput: {
                    type: 'object',
                    required: ['schemaVersion', 'participantId', 'activityId', 'startedAtIso', 'endedAtIso', 'totalSeconds', 'sets'],
                    properties: {
                        schemaVersion: { type: 'string', example: '1.0' },
                        participantId: { type: 'string', example: 'PACIENTE_001' },
                        activityId: { type: 'string', example: 'tinto_easy_01' },
                        startedAtIso: { type: 'string', format: 'date-time' },
                        endedAtIso: { type: 'string', format: 'date-time' },
                        totalSeconds: { type: 'number', example: 355.17 },
                        summary: {
                            type: 'object',
                            properties: {
                                totalErrors: { type: 'integer' },
                                totalDrops: { type: 'integer' },
                                totalReleases: { type: 'integer' },
                                setsCompleted: { type: 'integer' }
                            }
                        },
                        sets: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/VRSetResult' }
                        }
                    }
                },
                VRSetResult: {
                    type: 'object',
                    required: ['setName', 'startedAtIso', 'endedAtIso', 'durationSeconds'],
                    properties: {
                        setName: { type: 'string', enum: ['Ingredients', 'Utensils', 'Preparation', 'Organization'] },
                        startedAtIso: { type: 'string', format: 'date-time' },
                        endedAtIso: { type: 'string', format: 'date-time' },
                        durationSeconds: { type: 'number' },
                        blockedCount: { type: 'integer', default: 0 },
                        dropsCount: { type: 'integer', default: 0 },
                        releasesCount: { type: 'integer', default: 0 },
                        completion: {
                            type: 'object',
                            properties: {
                                coffeeAdded: { type: 'boolean' },
                                sugarAdded: { type: 'boolean' },
                                cupCoffeeAmount01: { type: 'number' }
                            }
                        },
                        returnedObjects: { type: 'array', items: { type: 'string' } },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    code: { type: 'string', example: 'STOVE_ON_NO_POT' },
                                    message: { type: 'string' },
                                    timestampIso: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
