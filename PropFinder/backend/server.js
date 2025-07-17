const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const redis = require('redis');
const jwt = require('jsonwebtoken');

// Configurar variables de entorno
dotenv.config();

// Configurar Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Error: ', err));

// Conectar a Redis
redisClient.connect();

// Configurar PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Inicializar aplicación
const app = express();
app.use(cors());
app.use(express.json());

// Rutas de ejemplo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!user.rows[0]) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña (implementar bcrypt)
    // Generar token JWT
    const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET);
    
    res.json({ token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Ruta protegida
app.get('/api/properties', authenticateToken, async (req, res) => {
  try {
    const properties = await pool.query('SELECT * FROM properties');
    res.json(properties.rows);
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
