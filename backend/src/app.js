const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();

// Middlewares de seguridad y parsing
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitar temporalmente para que React + Vite en producción funcionen sin problemas
}));
app.use(cors());
app.use(express.json());

// Rutas base
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Aquí agregaremos las rutas del traductor y base de datos más adelante
const translationRoutes = require('./routes/translationRoutes');
app.use('/api/translations', translationRoutes);

// Servir el Frontend (React) de manera estática para el despliegue a la nube 24/7
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Manejo de rutas no encontradas API
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({ error: 'Endpoint not found' });
  } else {
    next();
  }
});

module.exports = app;
