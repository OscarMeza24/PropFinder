require('dotenv').config();
const { Pool } = require('pg');

async function testSupabaseConnection() {
  console.log('Intentando conectar a la base de datos de Supabase...');

  if (!process.env.DATABASE_URL) {
    console.error('Error: La variable de entorno DATABASE_URL no está definida.');
    console.log('Por favor, asegúrate de que tu archivo .env contiene la cadena de conexión de Supabase.');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const client = await pool.connect();
    console.log('¡Conexión a Supabase exitosa!');
    const res = await client.query('SELECT NOW()');
    console.log('Hora actual de la base de datos:', res.rows[0].now);
    client.release();
  } catch (err) {
    console.error('Error al conectar con la base de datos de Supabase:', err.stack);
  } finally {
    await pool.end();
  }
}

testSupabaseConnection();
