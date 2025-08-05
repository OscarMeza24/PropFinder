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

// Obtener perfil del usuario actual con datos específicos del rol
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const userRole = req.user.role;
  
  const result = await pool.query(
    `SELECT id, email, name, role, phone, avatar_url, is_verified, created_at, 
            last_login, preferences
     FROM users WHERE id = $1`,
    [userId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const user = result.rows[0];
  const response = { user };

  // Datos adicionales específicos para usuarios regulares
  if (userRole === 'user') {
    // Estadísticas del usuario
    const userStatsQuery = `
      SELECT 
        COUNT(DISTINCT f.property_id) as total_favorites,
        COUNT(DISTINCT sv.id) as total_visits,
        COUNT(DISTINCT ss.id) as saved_searches,
        COUNT(DISTINCT pc.id) as property_contacts,
        COUNT(DISTINCT r.id) as reviews_written
      FROM users u
      LEFT JOIN favorites f ON u.id = f.user_id
      LEFT JOIN scheduled_visits sv ON u.id = sv.user_id
      LEFT JOIN saved_searches ss ON u.id = ss.user_id
      LEFT JOIN property_contacts pc ON u.id = pc.user_id
      LEFT JOIN reviews r ON u.id = r.user_id
      WHERE u.id = $1
    `;
    
    const userStats = await pool.query(userStatsQuery, [userId]);
    
    // Propiedades favoritas recientes
    const recentFavoritesQuery = `
      SELECT p.id, p.title, p.price, p.city, p.images, p.views_count,
             u.name as agent_name, f.created_at as favorited_at
      FROM favorites f
      JOIN properties p ON f.property_id = p.id
      JOIN users u ON p.agent_id = u.id
      WHERE f.user_id = $1 AND p.status = 'active'
      ORDER BY f.created_at DESC
      LIMIT 5
    `;
    
    const recentFavorites = await pool.query(recentFavoritesQuery, [userId]);
    
    // Próximas visitas
    const upcomingVisitsQuery = `
      SELECT sv.id, sv.visit_date, sv.status, sv.notes,
             p.title as property_title, p.address, p.city,
             u.name as agent_name, u.phone as agent_phone
      FROM scheduled_visits sv
      JOIN properties p ON sv.property_id = p.id
      JOIN users u ON sv.agent_id = u.id
      WHERE sv.user_id = $1 AND sv.visit_date > NOW()
      ORDER BY sv.visit_date ASC
      LIMIT 5
    `;
    
    const upcomingVisits = await pool.query(upcomingVisitsQuery, [userId]);
    
    response.userData = {
      stats: userStats.rows[0],
      recentFavorites: recentFavorites.rows,
      upcomingVisits: upcomingVisits.rows,
    };
  }

  res.json(response);
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

// =================== RUTAS PARA VISITAS PROGRAMADAS ===================

/**
 * Obtener visitas programadas del usuario
 */
router.get('/visits', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { status, upcoming } = req.query;

  let whereClause = 'sv.user_id = $1';
  const queryParams = [userId];

  if (status) {
    whereClause += ' AND sv.status = $2';
    queryParams.push(status);
  }

  if (upcoming === 'true') {
    whereClause += ' AND sv.visit_date > NOW()';
  }

  const visitsQuery = `
    SELECT 
      sv.id, sv.visit_date, sv.status, sv.notes, sv.created_at,
      p.id as property_id, p.title as property_title, p.address, p.city, p.images,
      u.name as agent_name, u.email as agent_email, u.phone as agent_phone
    FROM scheduled_visits sv
    JOIN properties p ON sv.property_id = p.id
    JOIN users u ON sv.agent_id = u.id
    WHERE ${whereClause}
    ORDER BY sv.visit_date ASC
  `;

  const visits = await pool.query(visitsQuery, queryParams);

  res.json({
    visits: visits.rows,
  });
}));

/**
 * Programar una nueva visita
 */
router.post('/visits', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { property_id, visit_date, notes } = req.body;

  if (!property_id || !visit_date) {
    throw new ApiError(400, 'ID de propiedad y fecha de visita son requeridos');
  }

  // Verificar que la propiedad existe y obtener el agente
  const propertyQuery = await pool.query(
    'SELECT id, agent_id FROM properties WHERE id = $1 AND status = $2',
    [property_id, 'active'],
  );

  if (propertyQuery.rows.length === 0) {
    throw new ApiError(404, 'Propiedad no encontrada o no está disponible');
  }

  const agentId = propertyQuery.rows[0].agent_id;

  // Verificar que la fecha es futura
  const visitDateTime = new Date(visit_date);
  if (visitDateTime <= new Date()) {
    throw new ApiError(400, 'La fecha de visita debe ser futura');
  }

  // Crear la visita
  const result = await pool.query(
    `INSERT INTO scheduled_visits 
     (user_id, property_id, agent_id, visit_date, notes, status, created_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
     RETURNING *`,
    [userId, property_id, agentId, visit_date, notes],
  );

  res.status(201).json({
    message: 'Visita programada exitosamente',
    visit: result.rows[0],
  });
}));

/**
 * Cancelar una visita programada
 */
router.put('/visits/:visitId/cancel', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { visitId } = req.params;

  const result = await pool.query(
    `UPDATE scheduled_visits 
     SET status = 'cancelled', updated_at = NOW() 
     WHERE id = $1 AND user_id = $2 AND status = 'pending'
     RETURNING *`,
    [visitId, userId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Visita no encontrada o no se puede cancelar');
  }

  res.json({
    message: 'Visita cancelada exitosamente',
    visit: result.rows[0],
  });
}));

// =================== RUTAS PARA BÚSQUEDAS GUARDADAS ===================

/**
 * Obtener búsquedas guardadas del usuario
 */
router.get('/saved-searches', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;

  const searchesQuery = `
    SELECT id, name, filters, is_active, created_at, updated_at
    FROM saved_searches
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  const searches = await pool.query(searchesQuery, [userId]);

  res.json({
    savedSearches: searches.rows,
  });
}));

/**
 * Crear nueva búsqueda guardada
 */
router.post('/saved-searches', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { name, filters } = req.body;

  if (!name || !filters) {
    throw new ApiError(400, 'Nombre y filtros son requeridos');
  }

  const result = await pool.query(
    `INSERT INTO saved_searches (user_id, name, filters, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [userId, name, JSON.stringify(filters)],
  );

  res.status(201).json({
    message: 'Búsqueda guardada exitosamente',
    savedSearch: result.rows[0],
  });
}));

/**
 * Actualizar búsqueda guardada
 */
router.put('/saved-searches/:searchId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { searchId } = req.params;
  const { name, filters, is_active } = req.body;

  const result = await pool.query(
    `UPDATE saved_searches 
     SET name = COALESCE($1, name),
         filters = COALESCE($2, filters),
         is_active = COALESCE($3, is_active),
         updated_at = NOW()
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [name, filters ? JSON.stringify(filters) : null, is_active, searchId, userId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Búsqueda guardada no encontrada');
  }

  res.json({
    message: 'Búsqueda guardada actualizada exitosamente',
    savedSearch: result.rows[0],
  });
}));

/**
 * Eliminar búsqueda guardada
 */
router.delete('/saved-searches/:searchId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { searchId } = req.params;

  const result = await pool.query(
    'DELETE FROM saved_searches WHERE id = $1 AND user_id = $2 RETURNING *',
    [searchId, userId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Búsqueda guardada no encontrada');
  }

  res.json({
    message: 'Búsqueda guardada eliminada exitosamente',
  });
}));

// =================== RUTAS PARA CONTACTO CON PROPIEDADES ===================

/**
 * Contactar agente sobre una propiedad
 */
router.post('/property-contact', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { property_id, message, contact_type = 'general' } = req.body;

  if (!property_id || !message) {
    throw new ApiError(400, 'ID de propiedad y mensaje son requeridos');
  }

  // Verificar que la propiedad existe
  const propertyExists = await pool.query(
    'SELECT id FROM properties WHERE id = $1 AND status = $2',
    [property_id, 'active'],
  );

  if (propertyExists.rows.length === 0) {
    throw new ApiError(404, 'Propiedad no encontrada');
  }

  // Obtener datos del usuario
  const userQuery = await pool.query(
    'SELECT name, email, phone FROM users WHERE id = $1',
    [userId],
  );

  const user = userQuery.rows[0];

  // Crear el contacto
  const result = await pool.query(
    `INSERT INTO property_contacts 
     (property_id, user_id, name, email, phone, message, contact_type, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [property_id, userId, user.name, user.email, user.phone, message, contact_type],
  );

  res.status(201).json({
    message: 'Mensaje enviado al agente exitosamente',
    contact: result.rows[0],
  });
}));

/**
 * Obtener historial de contactos del usuario
 */
router.get('/property-contacts', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;

  const contactsQuery = `
    SELECT 
      pc.id, pc.message, pc.contact_type, pc.status, pc.created_at,
      p.id as property_id, p.title as property_title, p.address,
      u.name as agent_name, u.email as agent_email
    FROM property_contacts pc
    JOIN properties p ON pc.property_id = p.id
    JOIN users u ON p.agent_id = u.id
    WHERE pc.user_id = $1
    ORDER BY pc.created_at DESC
  `;

  const contacts = await pool.query(contactsQuery, [userId]);

  res.json({
    contacts: contacts.rows,
  });
}));

/**
 * Dashboard del usuario - Actividad y recomendaciones
 */
router.get('/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;

  // Estadísticas del usuario
  const statsQuery = `
    SELECT 
      COUNT(DISTINCT f.property_id) as total_favorites,
      COUNT(DISTINCT sv.id) as total_visits,
      COUNT(DISTINCT ss.id) as saved_searches,
      COUNT(DISTINCT pc.id) as property_contacts
    FROM users u
    LEFT JOIN favorites f ON u.id = f.user_id
    LEFT JOIN scheduled_visits sv ON u.id = sv.user_id
    LEFT JOIN saved_searches ss ON u.id = ss.user_id
    LEFT JOIN property_contacts pc ON u.id = pc.user_id
    WHERE u.id = $1
  `;

  const stats = await pool.query(statsQuery, [userId]);

  // Propiedades favoritas populares
  const trendingFavoritesQuery = `
    SELECT p.id, p.title, p.price, p.city, p.images, p.views_count
    FROM favorites f
    JOIN properties p ON f.property_id = p.id
    WHERE f.user_id = $1 AND p.status = 'active'
    ORDER BY p.views_count DESC
    LIMIT 5
  `;

  const trendingFavorites = await pool.query(trendingFavoritesQuery, [userId]);

  // Recomendaciones basadas en favoritos
  const recommendationsQuery = `
    SELECT DISTINCT p.id, p.title, p.price, p.city, p.property_type, p.images
    FROM properties p
    WHERE p.status = 'active'
      AND p.property_type IN (
        SELECT DISTINCT p2.property_type
        FROM favorites f
        JOIN properties p2 ON f.property_id = p2.id
        WHERE f.user_id = $1
      )
      AND p.id NOT IN (
        SELECT property_id FROM favorites WHERE user_id = $1
      )
    ORDER BY p.views_count DESC
    LIMIT 8
  `;

  const recommendations = await pool.query(recommendationsQuery, [userId]);

  res.json({
    stats: stats.rows[0],
    trendingFavorites: trendingFavorites.rows,
    recommendations: recommendations.rows,
  });
}));

/**
 * Actualizar preferencias del usuario
 */
router.put('/preferences', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const {
    preferred_contact_method,
    budget_range,
    preferred_locations,
    property_types,
    notification_frequency,
    newsletter_subscription,
  } = req.body;

  const userPreferences = {
    preferred_contact_method,
    budget_range,
    preferred_locations,
    property_types,
    notification_frequency,
    newsletter_subscription,
  };

  const result = await pool.query(
    `UPDATE users SET 
     preferences = COALESCE(preferences, '{}') || $1, 
     updated_at = NOW() 
     WHERE id = $2 
     RETURNING preferences`,
    [JSON.stringify(userPreferences), userId],
  );

  res.json({
    message: 'Preferencias actualizadas exitosamente',
    preferences: result.rows[0].preferences,
  });
}));

module.exports = router;
