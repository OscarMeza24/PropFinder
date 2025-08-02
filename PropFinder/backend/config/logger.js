const winston = require('winston');
const path = require('path');

// Configuración de formatos
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(({
    timestamp,
    level,
    message,
    stack,
    ...meta
  }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  }),
);

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'propfinder-backend' },
  transports: [
    // Archivo de errores
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Archivo de logs combinados
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Agregar transporte de consola en desarrollo
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// Función para loggear requests HTTP
const logRequest = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId || 'anonymous',
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// Función para loggear errores
const logError = (error, req = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };

  if (req) {
    errorData.request = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.userId || 'anonymous',
    };
  }

  logger.error('Application Error', errorData);
};

// Función para loggear métricas de WebSocket
const logWebSocket = (event, data) => {
  logger.info('WebSocket Event', {
    event,
    ...data,
  });
};

// Función para loggear métricas de base de datos
const logDatabase = (operation, table, duration, success = true) => {
  const level = success ? 'info' : 'error';
  logger[level]('Database Operation', {
    operation,
    table,
    duration: `${duration}ms`,
    success,
  });
};

// Función para loggear métricas de pagos
const logPayment = (
  provider,
  operation,
  amount,
  currency,
  success = true,
  error = null,
) => {
  const logData = {
    provider,
    operation,
    amount,
    currency,
    success,
  };

  if (error) {
    logData.error = error.message;
  }

  const level = success ? 'info' : 'error';
  logger[level]('Payment Operation', logData);
};

module.exports = {
  logger,
  logRequest,
  logError,
  logWebSocket,
  logDatabase,
  logPayment,
};
