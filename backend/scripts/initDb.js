require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default DB first to create the target DB if needed
  password: process.env.DB_PASSWORD || 'secret',
  port: process.env.DB_PORT || 5432,
});

const initDb = async () => {
  try {
    const targetDbName = process.env.DB_NAME || 'megapark_translator';
    
    // 1. Create database if it doesn't exist
    const res = await pool.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${targetDbName}'`);
    if (res.rowCount === 0) {
      console.log(`[Init] Creando base de datos ${targetDbName}...`);
      await pool.query(`CREATE DATABASE ${targetDbName}`);
      console.log(`[Init] Base de datos creada con éxito.`);
    } else {
      console.log(`[Init] Base de datos ${targetDbName} ya existe.`);
    }
    await pool.end();

    // 2. Connect to the new database to create tables
    const appPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: targetDbName,
      password: process.env.DB_PASSWORD || 'secret',
      port: process.env.DB_PORT || 5432,
    });

    console.log('[Init] Creando tablas si no existen...');
    // Creamos la tabla translations, incluyendo protección anti-inyecciones y estructura robusta
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS translations (
        id SERIAL PRIMARY KEY,
        original_text TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        source_language VARCHAR(10) NOT NULL,
        target_language VARCHAR(10) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('[Init] Tabla "translations" verificada/creada correctamente.');
    await appPool.end();
    console.log('✅ Inicialización completa.');

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
  }
};

initDb();