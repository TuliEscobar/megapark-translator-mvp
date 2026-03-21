const { pool } = require('../config/db');

// @sql-best-practices: Queries siempre parametrizadas ($1, $2, etc.) para evitar inyección SQL
const TranslationModel = {
  create: async ({ original_text, translated_text, source_language, target_language, recommendation }) => {
    const query = `
      INSERT INTO translations (original_text, translated_text, source_language, target_language, recommendation)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [original_text, translated_text, source_language, target_language, recommendation];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  getAll: async (limit = 50) => {
    const query = `
      SELECT * FROM (
        SELECT * FROM translations 
        ORDER BY created_at DESC 
        LIMIT $1
      ) sub 
      ORDER BY created_at ASC;
    `;
    const { rows } = await pool.query(query, [limit]);
    return rows;
  }
};

module.exports = TranslationModel;