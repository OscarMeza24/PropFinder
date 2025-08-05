const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const compression = require("compression");

// Configurar variables de entorno
dotenv.config();

// Importar configuraciones
const {
  helmetConfig,
  generalLimiter,
  speedLimiter,
  corsOptions,
  sanitizeInput,
} = require("./middleware/security.js");
const { logRequest } = require("./config/logger.js");
const errorHandler = require("./middleware/errorHandler.js");
const ApiError = require("./utils/ApiError.js");

// Importar rutas
const authRoutes = require("./routes/auth.js");
const propertyRoutes = require("./routes/properties.js");
const paymentRoutes = require("./routes/payments.js");
const userRoutes = require("./routes/users.js");
const { router: notificationRoutes } = require("./routes/notifications.js");
const analyticsRoutes = require("./routes/analytics.js");
const conversationRoutes = require("./routes/conversations.js");

// Inicializar aplicación
const app = express();

// Middleware de seguridad
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(compression());

// Rate limiting
app.use(generalLimiter);
app.use(speedLimiter);

// Middleware de parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitización de datos
app.use(sanitizeInput);

// Logging de requests
app.use(logRequest);

// Rutas de salud y métricas
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
  });
});

app.get("/api/metrics", (req, res) => {
  const metrics = {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.json(metrics);
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/conversations", conversationRoutes);

// Middleware para manejar rutas no encontradas (404)
// Si ninguna ruta anterior coincide, se ejecuta este middleware.
app.use((req, res, next) => {
  next(new ApiError(404, `No se pudo encontrar la ruta: ${req.originalUrl}`));
});

// Middleware de manejo de errores centralizado
// Debe ser el último middleware que se registra.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor PropFinder escuchando en puerto ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📈 Métricas: http://localhost:${PORT}/api/metrics`);
});

// Manejo de señales para cierre graceful
process.on("SIGTERM", () => {
  console.log("SIGTERM recibido, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT recibido, cerrando servidor...");
  process.exit(0);
});

module.exports = app;
