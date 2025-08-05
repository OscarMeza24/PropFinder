const WebSocket = require("ws");
const express = require("express");
const jwt = require("jsonwebtoken");
const http = require("http");
const cors = require("cors");

// Cargar variables de entorno desde el directorio backend
require("dotenv").config({ path: "../backend/.env" });

console.log("🔍 Verificando variables de entorno:");
console.log("DATABASE_URL existe:", !!process.env.DATABASE_URL);
console.log("JWT_SECRET existe:", !!process.env.JWT_SECRET);
console.log("PORT:", process.env.WEBSOCKET_PORT || 5001);

// Crear servidor HTTP
const server = http.createServer();

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

// Almacenar conexiones activas
const clients = new Map(); // userId -> WebSocket

// Autenticar conexión WebSocket
const authenticateConnection = (url) => {
  try {
    const token = new URL(url, "ws://localhost").searchParams.get("token");
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Error de autenticación WebSocket:", error.message);
    return null;
  }
};

// Manejar conexiones WebSocket
wss.on("connection", async (ws, req) => {
  console.log("Nueva conexión WebSocket");

  // Autenticar usuario
  const user = authenticateConnection(req.url);
  if (!user) {
    ws.close(1008, "Token inválido");
    return;
  }

  const userId = user.userId;
  console.log(`Usuario autenticado: ${userId}`);

  // Almacenar conexión
  clients.set(userId, ws);

  // Enviar mensaje de bienvenida
  ws.send(
    JSON.stringify({
      type: "connected",
      message: "Conectado al WebSocket de PropFinder",
      userId: userId,
    })
  );

  // Manejar mensajes
  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data);
      console.log(`Mensaje recibido de ${userId}:`, message.type);

      // Echo del mensaje de vuelta por ahora
      ws.send(
        JSON.stringify({
          type: "echo",
          originalMessage: message,
          timestamp: new Date().toISOString(),
        })
      );
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
    clients.delete(userId);
  });

  // Manejar errores
  ws.on("error", (error) => {
    console.error("Error en WebSocket:", error);
  });
});

// Crear aplicación Express básica
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Endpoint de salud
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    websocket: "running",
    connections: clients.size,
    timestamp: new Date().toISOString(),
  });
});

// Montar la aplicación Express en el servidor HTTP
server.on("request", app);

const PORT = process.env.WEBSOCKET_PORT || 5001;
server.listen(PORT, () => {
  console.log(
    `🚀 Servidor WebSocket simplificado escuchando en puerto ${PORT}`
  );
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
});

// Exportar para testing
module.exports = { wss, clients };
