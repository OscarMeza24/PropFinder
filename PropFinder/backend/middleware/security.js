const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// Rate limiting para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: {
    error: 'Demasiados intentos de login. Intenta de nuevo en 16 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: 'Demasiadas requests desde esta IP. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down para prevenir spam
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 50, // permitir 50 requests sin delay
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500;
  },
});

// Configuración de Helmet
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Middleware de validación
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array(),
    });
  }
  return next();
};

// Sanitización de datos
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [],
          allowedAttributes: {},
        });
      }
    });
  }
  next();
};

// Validaciones específicas
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone(),
  validate,
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
];

const validateProperty = [
  body('title').trim().isLength({ min: 5, max: 255 }),
  body('price').isFloat({ min: 0 }),
  body('address').trim().isLength({ min: 5, max: 500 }),
  body('city').trim().isLength({ min: 2, max: 100 }),
  body('state').trim().isLength({ min: 2, max: 100 }),
  body('property_type').isIn([
    'house',
    'apartment',
    'condo',
    'townhouse',
    'land',
    'commercial',
  ]),
  body('bedrooms').optional().isInt({ min: 0, max: 20 }),
  body('bathrooms').optional().isFloat({ min: 0, max: 20 }),
  body('square_feet').optional().isInt({ min: 0 }),
  validate,
];

const validatePayment = [
  body('amount').isFloat({ min: 0.01 }),
  body('currency').optional().isIn(['USD', 'EUR', 'MXN']),
  body('propertyId').optional().isInt({ min: 1 }),
  validate,
];

// Middleware de CORS mejorado
const corsOptions = {
  origin: (origin, callback) => {
    console.log('Origen de la solicitud:', origin);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.log('Modo desarrollo: permitiendo cualquier origen');
      return callback(null, true);
    }
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://propfinder.com',
      'https://www.propfinder.com',
    ];
    console.log('Orígenes permitidos:', allowedOrigins);
    if (!origin) {
      console.log('Solicitud sin origen (posiblemente una solicitud directa)');
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `El origen ${origin} no tiene permiso de acceso.`;
      console.error('Origen no permitido:', origin);
      console.error('Orígenes permitidos:', allowedOrigins);
      return callback(new Error(msg), false);
    }
    console.log('Origen permitido:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

module.exports = {
  authLimiter,
  generalLimiter,
  speedLimiter,
  helmetConfig,
  sanitizeInput,
  validateRegistration,
  validateLogin,
  validateProperty,
  validatePayment,
  corsOptions,
};
