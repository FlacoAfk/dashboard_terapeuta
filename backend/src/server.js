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
require('dotenv').config();

// Importar rutas
const apiRoutes = require('./routes/api');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// MIDDLEWARES
// ========================================

// Permitir peticiones desde Electron
app.use(cors({
  origin: ['http://localhost:3000', 'file://'],
  credentials: true
}));

// Parsear JSON en el body de las peticiones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// RUTAS
// ========================================

// Verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API (ver archivo routes/api.js)
app.use('/api', apiRoutes);

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

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('🚀 BACKEND INICIADO');
  console.log('========================================');
  console.log(`📡 Servidor: http://localhost:${PORT}`);
  console.log(`❤️  Health:   http://localhost:${PORT}/health`);
  console.log(`📋 API:      http://localhost:${PORT}/api/status`);
  console.log('========================================');
  console.log('');
});

module.exports = app;
