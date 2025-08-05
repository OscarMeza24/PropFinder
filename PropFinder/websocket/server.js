const WebSocket = require("ws");
const express = require("express");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const http = require("http");
const dotenv = require("dotenv");
const redis = require("redis");
const cors = require("cors");

// Cargar variables de entorno
dotenv.config({ path: "../backend/.env" });

// Configurar PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Verificar conexión a la base de datos
pool
  .connect()
  .then(() => console.log("✅ WebSocket conectado a Supabase PostgreSQL"))
  .catch((err) =>
    console.error("❌ Error conectando WebSocket a la base de datos:", err)
  );

// Configurar Redis (opcional en desarrollo)
let redisClient = null;
let redisSubscriber = null;

if (process.env.NODE_ENV === "production" || process.env.USE_REDIS === "true") {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    redisClient.on("error", (err) => console.log("Redis Error: ", err));

    // Conectar a Redis
    redisClient.connect().catch(console.error);

    // Suscribirse al canal de notificaciones
    redisSubscriber = redisClient.duplicate();
    redisSubscriber.connect().catch(console.error);

    redisSubscriber.subscribe("notifications", (message) => {
      try {
        const data = JSON.parse(message);
        const { userId, notification } = data;

        // Enviar notificación al usuario si está conectado
        const client = clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "notification",
              notification,
            })
          );
          console.log(`Notificación enviada al usuario ${userId}`);
        }
      } catch (error) {
        console.error("Error al procesar notificación de Redis:", error);
      }
    });

    console.log("✅ Redis configurado y conectado");
  } catch (error) {
    console.log("ℹ️  Redis no disponible, funcionando en modo local");
  }
} else {
  console.log(
    "ℹ️  Redis está deshabilitado (NODE_ENV no es producción y USE_REDIS no está establecido)"
  );
}

// Crear servidor HTTP
const server = http.createServer();

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

// Almacenar conexiones activas
const clients = new Map(); // userId -> WebSocket
const rooms = new Map(); // roomId -> Set of userIds

// Autenticar conexión WebSocket
const authenticateConnection = (url) => {
  try {
    const token = new URL(url, "ws://localhost").searchParams.get("token");
    if (!token) {
      console.log("No se proporcionó token en la conexión WebSocket");
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log("Token expirado en conexión WebSocket:", error.expiredAt);
    } else if (error.name === 'JsonWebTokenError') {
      console.log("Token inválido en conexión WebSocket:", error.message);
    } else {
      console.error("Error de autenticación WebSocket:", error);
    }
    return null;
  }
};

// Función para generar un ID de sala único y consistente para dos usuarios
const getRoomIdForUsers = (userId1, userId2) => {
  // Ordenar los IDs alfabéticamente para asegurar consistencia
  const ids = [userId1, userId2].sort();
  return `chat-${ids[0]}-${ids[1]}`;
};

// Crear o unirse a una sala de chat
const joinRoom = (userId, roomId, ws) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  rooms.get(roomId).add(userId);
  clients.set(userId, ws);

  // Notificar a otros usuarios en la sala
  broadcastToRoom(
    roomId,
    {
      type: "user_joined",
      userId,
      roomId,
      timestamp: new Date().toISOString(),
    },
    userId
  );

  console.log(`Usuario ${userId} se unió a la sala ${roomId}`);
};

// Enviar mensaje a todos en una sala
const broadcastToRoom = (roomId, message, excludeUserId = null) => {
  const room = rooms.get(roomId);
  if (!room) return;

  room.forEach((userId) => {
    if (userId !== excludeUserId) {
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  });
};

// Guardar mensaje en la base de datos
const saveMessage = async (
  senderId,
  receiverId,
  roomId,
  content,
  messageType = "text"
) => {
  try {
    const result = await pool.query(
      `
      INSERT INTO messages (sender_id, receiver_id, room_id, content, message_type, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `,
      [senderId, receiverId, roomId, content, messageType]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error al guardar mensaje:", error);
    return null;
  }
};

// Manejar conexiones WebSocket
wss.on("connection", async (ws, req) => {
  console.log("Nueva conexión WebSocket");

  // Autenticar usuario
  const user = authenticateConnection(req.url);
  if (!user) {
    console.log("Conexión WebSocket rechazada por autenticación fallida");
    // Enviar código de error específico para token expirado
    ws.close(4001, "Token expirado o inválido");
    return;
  }

  const userId = user.userId;
  console.log(`Usuario autenticado: ${userId}`);

  // Registrar cliente
  clients.set(userId, ws);

  // Enviar confirmación de conexión
  ws.send(JSON.stringify({
    type: "connection_established",
    userId: userId
  }));

  // Manejar mensajes
  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case "join_room":
          joinRoom(userId, message.roomId, ws);

          // Enviar historial de mensajes
          const history = await pool.query(
            `
            SELECT m.*, u.name as sender_name
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.room_id = $1
            ORDER BY m.created_at ASC
            LIMIT 50
          `,
            [message.roomId]
          );

          ws.send(
            JSON.stringify({
              type: "message_history",
              messages: history.rows,
            })
          );
          break;

        case "send_message":
          const { receiverId, content, messageType = "text" } = message;
          let { roomId } = message;

          // Si no hay roomId, es un chat 1-a-1, así que lo generamos
          if (!roomId) {
            roomId = getRoomIdForUsers(userId, receiverId);
          }

          // Guardar mensaje en la base de datos
          const savedMessage = await saveMessage(
            userId,
            receiverId,
            roomId,
            content,
            messageType
          );

          if (savedMessage) {
            // Obtener información del remitente
            const senderInfo = await pool.query(
              "SELECT id, name FROM users WHERE id = $1",
              [userId]
            );

            const messageData = {
              type: "new_message",
              message: {
                ...savedMessage,
                sender_name: senderInfo.rows[0]?.name,
              },
            };

            // Unir al remitente a la sala si no está ya
            if (!rooms.has(roomId) || !rooms.get(roomId).has(userId)) {
              joinRoom(userId, roomId, ws);
            }

            // Enviar el mensaje a todos en la sala (incluido el remitente)
            broadcastToRoom(roomId, messageData);
          }
          break;

        case "typing_start":
          broadcastToRoom(
            message.roomId,
            {
              type: "user_typing",
              userId,
              roomId,
              isTyping: true,
            },
            userId
          );
          break;

        case "typing_stop":
          broadcastToRoom(
            message.roomId,
            {
              type: "user_typing",
              userId,
              roomId,
              isTyping: false,
            },
            userId
          );
          break;

        case "read_messages":
          // Marcar mensajes como leídos
          await pool.query(
            `
            UPDATE messages 
            SET read_at = NOW() 
            WHERE receiver_id = $1 AND room_id = $2 AND read_at IS NULL
          `,
            [userId, message.roomId]
          );

          // Notificar al remitente
          const senderClient = clients.get(message.senderId);
          if (senderClient && senderClient.readyState === WebSocket.OPEN) {
            senderClient.send(
              JSON.stringify({
                type: "messages_read",
                readerId: userId,
                roomId: message.roomId,
              })
            );
          }
          break;

        default:
          console.log("Tipo de mensaje desconocido:", message.type);
      }
    } catch (error) {
      console.error("Error al procesar mensaje:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Error al procesar el mensaje",
        })
      );
    }
  });

  // Manejar desconexión
  ws.on("close", () => {
    console.log(`Usuario ${userId} se desconectó`);

    // Remover de todas las salas
    rooms.forEach((userIds, roomId) => {
      if (userIds.has(userId)) {
        userIds.delete(userId);

        // Notificar a otros usuarios
        broadcastToRoom(roomId, {
          type: "user_left",
          userId,
          roomId,
          timestamp: new Date().toISOString(),
        });

        // Si la sala está vacía, eliminarla
        if (userIds.size === 0) {
          rooms.delete(roomId);
        }
      }
    });

    // Remover de clientes activos
    clients.delete(userId);
  });

  // Manejar errores
  ws.on("error", (error) => {
    console.error("Error en WebSocket:", error);
  });
});

// Endpoint para obtener conversaciones del usuario

// Crear middleware de autenticación local
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token de acceso requerido" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido o expirado" });
    }
    req.user = user;
    next();
  });
};

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Obtener conversaciones del usuario
app.get("/api/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await pool.query(
      `
      SELECT DISTINCT
        CASE 
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END as other_user_id,
        u.name as other_user_name,
        u.email as other_user_email,
        (
          SELECT content 
          FROM messages 
          WHERE (sender_id = $1 AND receiver_id = other_user_id) 
             OR (sender_id = other_user_id AND receiver_id = $1)
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at 
          FROM messages 
          WHERE (sender_id = $1 AND receiver_id = other_user_id) 
             OR (sender_id = other_user_id AND receiver_id = $1)
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) 
          FROM messages 
          WHERE receiver_id = $1 
            AND sender_id = other_user_id 
            AND read_at IS NULL
        ) as unread_count
      FROM messages m
      LEFT JOIN users u ON (
        CASE 
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END = u.id
      )
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY last_message_time DESC
    `,
      [userId]
    );

    res.json({ conversations: conversations.rows });
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Obtener mensajes de una conversación
app.get(
  "/api/conversations/:otherUserId/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const { otherUserId } = req.params;
      const userId = req.user.userId;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const messages = await pool.query(
        `
      SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4
    `,
        [userId, otherUserId, limit, offset]
      );

      // Marcar mensajes como leídos
      await pool.query(
        `
      UPDATE messages 
      SET read_at = NOW() 
      WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL
    `,
        [otherUserId, userId]
      );

      res.json({
        messages: messages.rows.reverse(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.rows.length,
        },
      });
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
);

// Crear nueva conversación
app.post("/api/conversations", authenticateToken, async (req, res) => {
  try {
    const { receiverId, initialMessage } = req.body;
    const senderId = req.user.userId;

    if (!receiverId) {
      return res
        .status(400)
        .json({ message: "ID del destinatario es requerido" });
    }

    // Verificar que el destinatario existe
    const receiver = await pool.query(
      "SELECT id, name FROM users WHERE id = $1",
      [receiverId]
    );
    if (receiver.rows.length === 0) {
      return res.status(404).json({ message: "Destinatario no encontrado" });
    }

    const roomId = getRoomIdForUsers(senderId, receiverId);
    let messageId = null;

    // Si hay mensaje inicial, guardarlo
    if (initialMessage) {
      const savedMessage = await saveMessage(
        senderId,
        receiverId,
        roomId,
        initialMessage
      );
      messageId = savedMessage?.id;
    }

    res.status(201).json({
      message: "Conversación creada exitosamente",
      receiver: receiver.rows[0],
      roomId,
      initialMessageId: messageId,
    });
  } catch (error) {
    console.error("Error al crear conversación:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Montar la aplicación Express en el servidor HTTP
server.on("request", app);

const PORT = process.env.WEBSOCKET_PORT || 5001;
server.listen(PORT, () => {
  console.log(`Servidor WebSocket escuchando en puerto ${PORT}`);
});

module.exports = { wss, clients, rooms };
