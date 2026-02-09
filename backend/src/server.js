/**
 * ========================================
 * SERVIDOR BACKEND - Express
 * ========================================
 * 
 * Este archivo configura y ejecuta el servidor API.
 * Puerto por defecto: 3001
 * 
 * Para iniciar: npm run dev (desde carpeta backend)
 */

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Importar configuración de Supabase y Swagger
const { testConnection } = require('./config/supabase');
const swaggerSpec = require('./config/swagger');

// Importar rutas existentes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const auditRoutes = require('./routes/audit');
const vrResultsRoutes = require('./routes/vrResults');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// MIDDLEWARES
// ========================================

// Permitir peticiones desde Electron y Vite dev server
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'file://',
    'https://cerebro-al-fuego-image-482550109792.us-central1.run.app'
  ],
  credentials: true
}));

// Parsear JSON en el body de las peticiones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// SWAGGER DOCUMENTATION
// ========================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dashboard Terapeuta - API Docs'
}));

// Endpoint para obtener el JSON de Swagger
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ========================================
// RUTAS
// ========================================

// Verificar que el servidor está funcionando
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Estado del servidor
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 */
app.get('/health', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    status: 'ok',
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    docs: `${baseUrl}/api-docs`
  });
});

// Rutas de la API
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/audit', auditRoutes);

// Endpoint para resultados de sesiones VR (nuevo formato)
app.use('/api/v1', vrResultsRoutes);

// ========================================
// MANEJO DE ERRORES
// ========================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: { message: err.message || 'Error interno del servidor' }
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, async () => {
  console.log('');
  console.log('========================================');
  console.log('🚀 BACKEND INICIADO (Supabase)');
  console.log('========================================');
  console.log(`📡 Servidor:  http://localhost:${PORT}`);
  console.log(`❤️  Health:    http://localhost:${PORT}/health`);
  console.log(`📋 API:       http://localhost:${PORT}/api/status`);
  console.log(`📚 Docs:      http://localhost:${PORT}/api-docs`);
  console.log('----------------------------------------');
  console.log('📁 Rutas VR Unity:');
  console.log(`   - VR Results: /api/v1/session-results`);
  console.log('========================================');

  // Verificar conexión a Supabase
  await testConnection();

  console.log('');
});

module.exports = app;


