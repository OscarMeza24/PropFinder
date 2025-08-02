const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth.js');
const { sanitizeInput } = require('../middleware/security.js');
const { pool, redisClient } = require('../config/database.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiError = require('../utils/ApiError.js');
const {
  sendPasswordResetEmail,
  sendEmailVerification,
} = require('../config/email.js');

const router = express.Router();

// Obtener perfil del usuario actual
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, email, name, role, phone, avatar_url, is_verified, created_at FROM users WHERE id = $1',
    [req.user.userId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  res.json({ user: result.rows[0] });
}));

// Actualizar perfil del usuario
router.put('/profile', authenticateToken, sanitizeInput, asyncHandler(async (req, res) => {
  const { name, phone, avatar_url } = req.body;

  const query = `
    UPDATE users
    SET name = COALESCE($1, name), 
        phone = COALESCE($2, phone), 
        avatar_url = COALESCE($3, avatar_url), 
        updated_at = NOW()
    WHERE id = $4
    RETURNING id, email, name, role, phone, avatar_url, is_verified, created_at
  `;
  const result = await pool.query(query, [name, phone, avatar_url, req.user.userId]);

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  res.json({
    message: 'Perfil actualizado exitosamente',
    user: result.rows[0],
  });
}));

// Cambiar contraseña
router.put('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Se requieren la contraseña actual y la nueva.');
  }

  const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.userId]);

  if (userResult.rows.length === 0) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password);
  if (!isValidPassword) {
    throw new ApiError(400, 'La contraseña actual es incorrecta.');
  }

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await pool.query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, req.user.userId],
  );

  res.json({ message: 'Contraseña cambiada exitosamente' });
}));

// Solicitar restablecimiento de contraseña
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, 'El correo electrónico es requerido.');
  }

  const userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);

  if (userResult.rows.length > 0) {
    const user = userResult.rows[0];
    const resetToken = uuidv4();

    await redisClient.setEx(
      `reset_token:${resetToken}`,
      86400,
      JSON.stringify({ userId: user.id }),
    );
    await sendPasswordResetEmail(user, resetToken);
  }

  res.json({
    message: 'Si tu correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.',
  });
}));

// Restablecer contraseña con token
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    throw new ApiError(400, 'El token y la nueva contraseña son requeridos.');
  }

  const tokenData = await redisClient.get(`reset_token:${token}`);
  if (!tokenData) {
    throw new ApiError(400, 'Token inválido o expirado.');
  }

  const { userId } = JSON.parse(tokenData);
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await pool.query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, userId],
  );
  await redisClient.del(`reset_token:${token}`);

  res.json({ message: 'Contraseña restablecida exitosamente.' });
}));

// Verificar email
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    throw new ApiError(400, 'Token de verificación requerido.');
  }

  const tokenData = await redisClient.get(`verify_token:${token}`);
  if (!tokenData) {
    throw new ApiError(400, 'Token inválido o expirado.');
  }

  const { userId } = JSON.parse(tokenData);

  await pool.query('UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1', [userId]);
  await redisClient.del(`verify_token:${token}`);

  res.json({ message: 'Email verificado exitosamente.' });
}));

// Reenviar email de verificación
router.post('/resend-verification', authenticateToken, asyncHandler(async (req, res) => {
  const userResult = await pool.query(
    'SELECT id, name, email, is_verified FROM users WHERE id = $1',
    [req.user.userId],
  );

  if (userResult.rows.length === 0) {
    throw new ApiError(404, 'Usuario no encontrado.');
  }

  const user = userResult.rows[0];
  if (user.is_verified) {
    throw new ApiError(400, 'El correo electrónico ya ha sido verificado.');
  }

  const verificationToken = uuidv4();
  await redisClient.setEx(`verify_token:${verificationToken}`, 86400, JSON.stringify({ userId: user.id }));
  await sendEmailVerification(user, verificationToken);

  res.json({ message: 'Se ha enviado un nuevo correo de verificación.' });
}));

// Obtener favoritos del usuario
router.get('/favorites', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const favoritesQuery = pool.query(`
    SELECT p.*, u.name as agent_name, u.phone as agent_phone, u.email as agent_email
    FROM favorites f
    JOIN properties p ON f.property_id = p.id
    JOIN users u ON p.agent_id = u.id
    WHERE f.user_id = $1 AND p.status = 'active'
    ORDER BY f.created_at DESC
    LIMIT $2 OFFSET $3
  `, [req.user.userId, limit, offset]);

  const countQuery = pool.query(`
    SELECT COUNT(*)
    FROM favorites f
    JOIN properties p ON f.property_id = p.id
    WHERE f.user_id = $1 AND p.status = 'active'
  `, [req.user.userId]);

  const [favoritesResult, countResult] = await Promise.all([favoritesQuery, countQuery]);

  const total = parseInt(countResult.rows[0].count, 10);

  res.json({
    favorites: favoritesResult.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

// Agregar a favoritos
router.post('/favorites/:propertyId', authenticateToken, asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const propertyResult = await pool.query(
    'SELECT id FROM properties WHERE id = $1 AND status = $2',
    [propertyId, 'active'],
  );

  if (propertyResult.rows.length === 0) {
    throw new ApiError(404, 'Propiedad no encontrada o no disponible.');
  }

  await pool.query(
    'INSERT INTO favorites (user_id, property_id) VALUES ($1, $2) ON CONFLICT (user_id, property_id) DO NOTHING',
    [req.user.userId, propertyId],
  );

  res.status(201).json({ message: 'Propiedad agregada a favoritos.' });
}));

// Eliminar de favoritos
router.delete('/favorites/:propertyId', authenticateToken, asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const result = await pool.query(
    'DELETE FROM favorites WHERE user_id = $1 AND property_id = $2',
    [req.user.userId, propertyId],
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, 'La propiedad no se encuentra en tus favoritos.');
  }

  res.status(204).send();
}));

module.exports = router;
