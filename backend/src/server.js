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

// Importar nuevas rutas (sesiones VR, eventos, evaluaciones, métricas)
const sesionesRoutes = require('./routes/sesiones');
const eventosRoutes = require('./routes/eventos');
const evaluacionRoutes = require('./routes/evaluacion');
const metricasRoutes = require('./routes/metricas');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// MIDDLEWARES
// ========================================

// Permitir peticiones desde Electron y Vite dev server
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'file://'],
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
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    docs: `http://localhost:${PORT}/api-docs`
  });
});

// Rutas de la API
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/audit', auditRoutes);

// Nuevas rutas para Unity/VR (RF-BDD-02, RF-BDD-03, RF-BDD-04, RF-BDD-09)
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/evaluacion', evaluacionRoutes);
app.use('/api/metricas', metricasRoutes);

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
  console.log('📁 Nuevas rutas Unity/VR:');
  console.log(`   - Sesiones:   /api/sesiones`);
  console.log(`   - Eventos:    /api/eventos`);
  console.log(`   - Evaluación: /api/evaluacion`);
  console.log(`   - Métricas:   /api/metricas`);
  console.log('========================================');

  // Verificar conexión a Supabase
  await testConnection();

  console.log('');
});

module.exports = app;


