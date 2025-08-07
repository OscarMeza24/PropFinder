const { Pool } = require('pg');
const redis = require('redis');
const { URL } = require('url');
const path = require('path');

// Asegurar que dotenv esté cargado con ruta específica
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configurar PostgreSQL para Supabase
const isProduction = process.env.NODE_ENV === 'production';

// Parsear URL de base de datos para evitar problemas con contraseñas especiales
const createPoolConfig = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está definida en las variables de entorno');
  }

  // Intentar crear pool con connectionString primero (más simple)
  try {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Necesario para Supabase
      },
      // Aumentar timeouts para conexiones más estables
      connectionTimeoutMillis: 10000, // 10 segundos
      idleTimeoutMillis: 30000, // 30 segundos
      // Habilitar keep-alive
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000, // 10 segundos
    };
  } catch (error) {
    console.warn('⚠️  No se pudo usar connectionString, intentando parsear URL manualmente...');
    
    // Si falla, parsear URL manualmente
    const dbUrl = new URL(process.env.DATABASE_URL);
    return {
      host: dbUrl.hostname,
      port: dbUrl.port,
      database: dbUrl.pathname.slice(1), // Remove leading /
      user: dbUrl.username,
      password: dbUrl.password,
      ssl: {
        rejectUnauthorized: false, // Necesario para Supabase
      },
      // Aumentar timeouts para conexiones más estables
      connectionTimeoutMillis: 10000, // 10 segundos
      idleTimeoutMillis: 30000, // 30 segundos
      // Habilitar keep-alive
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000, // 10 segundos
    };
  }
};

const pool = new Pool(createPoolConfig());

// Manejar errores de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL:', err);
  process.exit(-1); // Terminar la aplicación si hay un error crítico
});

// Configurar Redis (opcional en desarrollo)
let redisClient = null;

// Solo conectar a Redis en producción o si se especifica explícitamente
const initializeRedis = async () => {
  if (process.env.NODE_ENV === 'production' || process.env.USE_REDIS === 'true') {
    try {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              console.warn('⚠️  No se pudo conectar a Redis después de varios intentos. Continuando sin Redis...');
              redisClient = null;
              return false; // Detener intentos de reconexión
            }
            return Math.min(retries * 1000, 5000); // Reintentar con backoff
          },
        },
      });

      redisClient.on('error', (err) => {
        console.warn('⚠️  Error de Redis (continuando sin cacheo):', err.message);
        redisClient = null;
      });

      await redisClient.connect();
      console.log('✅ Conexión exitosa a Redis');
      return redisClient;
    } catch (err) {
      console.warn('⚠️  No se pudo conectar a Redis (continuando sin cacheo):', err.message);
      redisClient = null;
      return null;
    }
  } else {
    console.log('ℹ️  Redis está deshabilitado (NODE_ENV no es producción y USE_REDIS no está establecido)');
    return null;
  }
};

// Función para probar la conexión a la base de datos
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a Supabase PostgreSQL');
    const res = await client.query('SELECT NOW()');
    console.log('✅ Hora actual de la base de datos:', res.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    // No salir del proceso para permitir que el servidor intente reconectarse
  }
}

// Función wrapper segura para Redis
const executeWithRedis = async (callback) => {
  if (!redisClient) {
    return null;
  }
  try {
    return await callback(redisClient);
  } catch (err) {
    console.warn('Error al ejecutar comando de Redis:', err.message);
    return null;
  }
};

// Inicializar conexiones al arrancar
const initializeConnections = async () => {
  await initializeRedis();

  if (process.env.NODE_ENV !== 'test') {
    await testConnection();
  }
};

// Inicializar conexiones
initializeConnections().catch(console.error);

module.exports = {
  pool,
  redisClient,
  executeWithRedis,
  testConnection,
  initializeConnections,
};
