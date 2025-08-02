const { logError } = require('../config/logger.js');

const errorHandler = (err, req, res, _next) => {
  let { statusCode, message } = err;

  // Si el error no es operacional, lo consideramos un error del servidor
  if (!err.isOperational) {
    statusCode = 500;
    message = 'Error Interno del Servidor';
  }

  // Log del error
  logError(err);

  // Manejo de errores específicos de JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 403;
    message = 'Token inválido o corrupto.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 403;
    message = 'El token ha expirado.';
  }

  res.status(statusCode || 500).json({
    status: 'error',
    message,
    // Solo incluir el stack de error en modo de desarrollo
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
