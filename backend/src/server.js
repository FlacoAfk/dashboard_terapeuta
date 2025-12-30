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

// Importar configuración de base de datos y Swagger
const { testConnection } = require('./config/database');
const swaggerSpec = require('./config/swagger');

// Importar rutas
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const auditRoutes = require('./routes/audit');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// MIDDLEWARES
// ========================================

// Permitir peticiones desde Electron y Vite dev server
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'file://'],
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

// Rutas de la API (ver archivo routes/api.js)
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/audit', auditRoutes);

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
  console.log('🚀 BACKEND INICIADO');
  console.log('========================================');
  console.log(`📡 Servidor: http://localhost:${PORT}`);
  console.log(`❤️  Health:   http://localhost:${PORT}/health`);
  console.log(`📋 API:      http://localhost:${PORT}/api/status`);
  console.log(`📚 Docs:     http://localhost:${PORT}/api-docs`);
  console.log('========================================');

  // Verificar conexión a base de datos
  await testConnection();

  console.log('');
});

module.exports = app;

