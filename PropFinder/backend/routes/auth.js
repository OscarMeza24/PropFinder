const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database.js');
const {
  validateRegistration,
  validateLogin,
} = require('../middleware/security.js');
const { authenticateToken } = require('../middleware/auth.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiError = require('../utils/ApiError.js');

const router = express.Router();

/**
 * Registro de usuario
 */
router.post(
  '/register',
  validateRegistration,
  asyncHandler(async (req, res) => {
    const {
      email,
      password,
      name,
      phone,
    } = req.body;
    // Verificar si el usuario ya existe
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );
    if (userExists.rows.length > 0) {
      throw new ApiError(400, 'El correo electrónico ya está registrado');
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el usuario
    const query = `
    INSERT INTO users (email, password, name, phone, role, is_verified)
    VALUES ($1, $2, $3, $4, 'user', false)
    RETURNING id, email, name, phone, role, created_at
  `;
    const result = await pool.query(query, [
      email,
      hashedPassword,
      name,
      phone,
    ]);
    const user = result.rows[0];

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    // Enviar respuesta
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at,
      },
      token,
    });
  }),
);

/**
 * Login de usuario
 */
router.post(
  '/login',
  validateLogin,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Buscar usuario por email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    const user = result.rows[0];

    // Verificar si el usuario existe y la contraseña es correcta
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new ApiError(401, 'Credenciales inválidas');
    }

    // Verificar si la cuenta está verificada (temporalmente deshabilitado para testing)
    /*
    if (!user.is_verified) {
      throw new ApiError(
        403,
        'Por favor verifica tu correo electrónico para activar tu cuenta'
      );
    }
    */

    // Generar tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    // Enviar respuesta
    res.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
      token: accessToken,
      refreshToken,
    });
  }),
);

/**
 * Obtener perfil de usuario
 */
router.get(
  '/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, email, name, phone, role, avatar_url, created_at FROM users WHERE id = $1',
      [userId],
    );
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Usuario no encontrado');
    }
    res.json({
      user: result.rows[0],
    });
  }),
);

/**
 * Actualizar perfil de usuario
 */
router.put(
  '/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { name, phone, avatar_url } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone),avatar_url = COALESCE($3, avatar_url), updated_at = NOW() WHERE id = $4 RETURNING id, email, name, phone, role, avatar_url, created_at',
      [name, phone, avatar_url, userId],
    );
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Usuario no encontrado');
    }
    res.json({
      message: 'Perfil actualizado exitosamente',
      user: result.rows[0],
    });
  }),
);

/**
 * Cambiar contraseña
 */
router.post(
  '/change-password',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(
        400,
        'La contraseña actual y la nueva contraseña son requeridas',
      );
    }

    // Obtener el usuario actual
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [
      userId,
    ]);
    const user = userResult.rows[0];
    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado');
    }
    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'La contraseña actual es incorrecta');
    }
    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    // Actualizar la contraseña
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId],
    );
    res.json({ message: 'Contraseña actualizada exitosamente' });
  }),
);

/**
 * Ruta para refrescar el token
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) {
      throw new ApiError(401, 'Token de refresco requerido');
    }

    const userResult = await pool.query(
      'SELECT id, name FROM users WHERE refresh_token = $1',
      [token],
    );
    if (userResult.rows.length === 0) {
      throw new ApiError(403, 'Token de refresco inválido o expirado');
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
      if (err) {
        throw new ApiError(403, 'Token de refresco inválido o expirado');
      }
      const payload = { id: user.id, name: userResult.rows[0].name };
      const secret = process.env.JWT_SECRET;
      const options = { expiresIn: '1h' };
      const newAccessToken = jwt.sign(payload, secret, options);
      res.json({ accessToken: newAccessToken });
    });
  }),
);

module.exports = router;
