class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Para distinguir errores operacionales de errores de programación

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
