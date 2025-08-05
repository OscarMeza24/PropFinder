require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function verifyUser() {
  try {
    const result = await pool.query(
      'UPDATE users SET is_verified = true WHERE email = $1 RETURNING email, is_verified',
      ['test@example.com'],
    );

    if (result.rows.length > 0) {
      console.log('✅ Usuario verificado exitosamente:', result.rows[0]);
    } else {
      console.log('❌ Usuario no encontrado');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyUser();
