const { Pool } = require('pg');

// @architecture: Configuración adaptable tanto para local como para la nube (DATABASE_URL de Render)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'megapark_translator',
      password: process.env.DB_PASSWORD || 'secret',
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('[PostgreSQL] Conexión establecida correctamente');
    
    // Creamos la tabla automáticamente si no existe (ideal para Render)
    await client.query(`
      CREATE TABLE IF NOT EXISTS translations (
        id SERIAL PRIMARY KEY,
        original_text TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        source_language VARCHAR(50) NOT NULL,
        target_language VARCHAR(50) NOT NULL,
        recommendation TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Aseguramos que la columna recommendation existe por si la tabla ya estaba creada
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='translations' AND column_name='recommendation') THEN
          ALTER TABLE translations ADD COLUMN recommendation TEXT;
        END IF;
      END $$;
    `);
    console.log('[PostgreSQL] Tabla "translations" verificada/creada');
    
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