const { Pool } = require('pg');

// Singleton para la pool de conexiones, siguiendo @architecture y @sql-best-practices
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'megapark_translator',
  password: process.env.DB_PASSWORD || 'secret',
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('[PostgreSQL] Conexión establecida correctamente');
    client.release();
  } catch (err) {
    console.error('[PostgreSQL] Error conectando a la base de datos:', err.stack);
    throw err;
  }
};

module.exports = {
  pool,
  connectDB
};
