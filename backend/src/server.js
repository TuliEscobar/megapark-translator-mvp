require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // 1. Conectar a PostgreSQL primero
    await connectDB();
    
    // 2. Si la base de datos responde, levantar Express
    app.listen(PORT, () => {
      console.log(`[Server] Corriendo de forma segura en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Fallo crítico al iniciar:', error);
    process.exit(1);
  }
};

startServer();
