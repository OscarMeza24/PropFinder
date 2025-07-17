const io = require('socket.io')(5001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const redis = require('redis');
require('dotenv').config();

// Configurar Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Error: ', err));

// Conectar a Redis
redisClient.connect();

// Manejar conexión de cliente
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Manejar unirse a una sala
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Cliente ${socket.id} se unió a la sala ${roomId}`);
  });

  // Manejar mensajes
  socket.on('sendMessage', async (data) => {
    const { roomId, content, senderId, senderName, senderAvatar } = data;
    
    // Emitir mensaje a todos en la sala
    io.to(roomId).emit('message', {
      id: Date.now().toString(),
      senderId,
      senderName,
      senderAvatar,
      content,
      timestamp: new Date().toISOString(),
      type: 'text'
    });

    // Guardar mensaje en Redis
    try {
      await redisClient.set(`message:${Date.now().toString()}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error guardando mensaje en Redis:', error);
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

console.log('Servidor WebSocket escuchando en puerto 5001');
