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
            version: '1.8.0',
            description: `
## API para el Dashboard de Terapeutas - Cerebro al Fuego

Esta API proporciona endpoints para gestionar:
- **Autenticación**: Login, setup, recuperación de contraseña
- **Usuarios**: Gestión de terapeutas (solo Superadmin)
- **Pacientes**: CRUD completo de pacientes
- **Sesiones VR**: Visualización, evaluación del desempeño y revisión de sesiones del videojuego Unity
- **VR Results**: Recepción de resultados desde Unity (API Key)
- **Terapeutas**: Información de terapeutas
- **Dashboard**: Estadísticas generales
- **Auditoría**: Registro y exportación de eventos del sistema

### Evaluación del Desempeño
Los terapeutas pueden asignar una calificación de desempeño (1-5) a cada sesión VR,
junto con observaciones clínicas. La calificación se almacena como prefijo en el campo
\`observaciones_terapeuta\` con formato \`[Calificación: X/5 - Label]\`.

### Seguridad
- JWT Bearer para endpoints autenticados
- API Key (X-API-Key) para endpoints de Unity
- Validación de ownership: terapeutas solo acceden a datos de sus pacientes
- Validación de inputs (UUID, longitud, tipos)
- Registro de auditoría para operaciones críticas

### Base de Datos
Conectada a **Supabase PostgreSQL**

### Variables de Entorno
El backend utiliza: PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, JWT_EXPIRES_IN, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, UNITY_API_KEY
      `,
            contact: {
                name: 'Cerebro al Fuego',
                email: 'cerebroalfuego@gmail.com'
            }
        },
        servers: [
            {
                url: 'https://cerebro-al-fuego-image-482550109792.us-central1.run.app',
                description: 'Producción - Google Cloud Run'
            },
            {
                url: 'http://localhost:3001',
                description: 'Desarrollo Local'
            }
        ],
        tags: [
            { name: 'Health', description: 'Estado del servidor' },
            { name: 'Autenticación', description: 'Login, setup, recuperación de contraseña y sesión' },
            { name: 'Usuarios', description: 'Gestión de usuarios y terapeutas (solo Superadmin)' },
            { name: 'Pacientes', description: 'CRUD de pacientes e informes' },
            { name: 'Sesiones VR', description: 'Visualización, evaluación del desempeño y revisión de sesiones VR en el dashboard' },
            { name: 'Terapeutas', description: 'Información de terapeutas' },
            { name: 'Dashboard', description: 'Estadísticas generales' },
            { name: 'Auditoría', description: 'Eventos de auditoría y exportación CSV (solo Superadmin)' },
            { name: 'VR Results', description: 'Recepción y consulta de resultados de sesiones VR (Unity)' },
            { name: 'Unity - Pacientes', description: 'Endpoints públicos para Unity (requiere API Key)' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenido del endpoint /api/auth/login'
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'API Key para endpoints de Unity (UNITY_API_KEY)'
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
    apis: ['./src/routes/*.js', './src/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
