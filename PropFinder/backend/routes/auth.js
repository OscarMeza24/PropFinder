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
 * Registro de usuario con validación de rol
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
      role = 'user', // Por defecto es user
    } = req.body;
    
    // Validar que el rol sea válido
    const validRoles = ['user', 'agent'];
    if (!validRoles.includes(role)) {
      throw new ApiError(400, 'Rol inválido. Debe ser "user" o "agent"');
    }
    
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
    VALUES ($1, $2, $3, $4, $5, false)
    RETURNING id, email, name, phone, role, created_at
  `;
    const result = await pool.query(query, [
      email,
      hashedPassword,
      name,
      phone,
      role,
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
      message: `${role === 'agent' ? 'Agente' : 'Usuario'} registrado exitosamente`,
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
 * Obtener perfil de usuario - Versión mejorada con datos específicos por rol
 */
router.get(
  '/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Consulta base para todos los usuarios
    const baseQuery = `
      SELECT id, email, name, phone, role, avatar_url, created_at, last_login, is_verified,
             preferences
      FROM users WHERE id = $1
    `;

    const result = await pool.query(baseQuery, [userId]);

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    const user = result.rows[0];
    const response = { user };

    // Datos adicionales específicos por rol
    if (userRole === 'agent') {
      // Estadísticas del agente
      const agentStatsQuery = `
        SELECT 
          COUNT(p.id) as total_properties,
          COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_properties,
          COUNT(CASE WHEN p.status = 'sold' THEN 1 END) as sold_properties,
          COUNT(CASE WHEN p.status = 'rented' THEN 1 END) as rented_properties,
          COALESCE(SUM(p.views_count), 0) as total_views,
          COUNT(DISTINCT sv.user_id) as total_clients,
          COUNT(CASE WHEN sv.status = 'pending' THEN 1 END) as pending_visits
        FROM properties p
        LEFT JOIN scheduled_visits sv ON p.id = sv.property_id
        WHERE p.agent_id = $1 AND p.status != 'deleted'
      `;

      const agentStats = await pool.query(agentStatsQuery, [userId]);

      // Propiedades recientes del agente
      const recentPropertiesQuery = `
        SELECT id, title, price, status, created_at, views_count
        FROM properties
        WHERE agent_id = $1 AND status != 'deleted'
        ORDER BY created_at DESC
        LIMIT 5
      `;

      const recentProperties = await pool.query(recentPropertiesQuery, [userId]);

      // Visitas pendientes
      const pendingVisitsQuery = `
        SELECT sv.id, sv.visit_date, sv.notes, p.title as property_title, 
               u.name as client_name, u.email as client_email, u.phone as client_phone
        FROM scheduled_visits sv
        JOIN properties p ON sv.property_id = p.id
        JOIN users u ON sv.user_id = u.id
        WHERE sv.agent_id = $1 AND sv.status = 'pending' AND sv.visit_date > NOW()
        ORDER BY sv.visit_date ASC
        LIMIT 10
      `;

      const pendingVisits = await pool.query(pendingVisitsQuery, [userId]);

      response.agentData = {
        stats: agentStats.rows[0],
        recentProperties: recentProperties.rows,
        pendingVisits: pendingVisits.rows,
      };
    } else if (userRole === 'user') {
      // Estadísticas del usuario
      const userStatsQuery = `
        SELECT 
          COUNT(f.id) as favorite_properties,
          COUNT(sv.id) as scheduled_visits,
          COUNT(pc.id) as property_contacts,
          COUNT(r.id) as reviews_written,
          COUNT(ss.id) as saved_searches
        FROM users u
        LEFT JOIN favorites f ON u.id = f.user_id
        LEFT JOIN scheduled_visits sv ON u.id = sv.user_id
        LEFT JOIN property_contacts pc ON u.id = pc.user_id
        LEFT JOIN reviews r ON u.id = r.user_id
        LEFT JOIN saved_searches ss ON u.id = ss.user_id
        WHERE u.id = $1
      `;

      const userStats = await pool.query(userStatsQuery, [userId]);

      // Propiedades favoritas recientes
      const favoritesQuery = `
        SELECT p.id, p.title, p.price, p.address, p.city, p.state, p.images,
               u.name as agent_name, f.created_at as favorited_at
        FROM favorites f
        JOIN properties p ON f.property_id = p.id
        JOIN users u ON p.agent_id = u.id
        WHERE f.user_id = $1 AND p.status = 'active'
        ORDER BY f.created_at DESC
        LIMIT 5
      `;

      const favorites = await pool.query(favoritesQuery, [userId]);

      // Visitas programadas
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

      // Búsquedas guardadas activas
      const savedSearchesQuery = `
        SELECT id, name, filters, created_at
        FROM saved_searches
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
        LIMIT 5
      `;

      const savedSearches = await pool.query(savedSearchesQuery, [userId]);

      response.userData = {
        stats: userStats.rows[0],
        favorites: favorites.rows,
        upcomingVisits: upcomingVisits.rows,
        savedSearches: savedSearches.rows,
      };
    }

    res.json(response);
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
      `UPDATE users SET 
       name = COALESCE($1, name), 
       phone = COALESCE($2, phone),
       avatar_url = COALESCE($3, avatar_url), 
       updated_at = NOW() 
       WHERE id = $4 
       RETURNING id, email, name, phone, role, avatar_url, created_at`,
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

// =================== RUTAS ESPECÍFICAS PARA AGENTES ===================

/**
 * Dashboard del agente - Estadísticas completas
 */
router.get(
  '/agent/dashboard',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'agent') {
      throw new ApiError(403, 'Acceso denegado. Solo para agentes');
    }

    const agentId = req.user.id;

    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_properties,
        COUNT(CASE WHEN p.status = 'sold' THEN 1 END) as sold_properties,
        COUNT(CASE WHEN p.status = 'rented' THEN 1 END) as rented_properties,
        COALESCE(SUM(p.views_count), 0) as total_views,
        COALESCE(AVG(p.price), 0) as avg_property_price,
        COUNT(DISTINCT sv.user_id) as unique_clients,
        COUNT(CASE WHEN sv.status = 'pending' THEN 1 END) as pending_visits,
        COUNT(CASE WHEN sv.status = 'completed' THEN 1 END) as completed_visits
      FROM properties p
      LEFT JOIN scheduled_visits sv ON p.id = sv.property_id
      WHERE p.agent_id = $1 AND p.status != 'deleted'
    `;

    const stats = await pool.query(statsQuery, [agentId]);

    // Ingresos del mes (simulado basado en propiedades vendidas)
    const monthlyRevenueQuery = `
      SELECT 
        COALESCE(SUM(p.price * 0.03), 0) as monthly_commission
      FROM properties p
      WHERE p.agent_id = $1 
        AND p.status = 'sold' 
        AND p.updated_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    const monthlyRevenue = await pool.query(monthlyRevenueQuery, [agentId]);

    // Actividad reciente
    const recentActivityQuery = `
      SELECT 
        'property_created' as type,
        p.title as description,
        p.created_at as date
      FROM properties p
      WHERE p.agent_id = $1
      UNION ALL
      SELECT 
        'visit_scheduled' as type,
        'Visita programada para ' || p.title as description,
        sv.created_at as date
      FROM scheduled_visits sv
      JOIN properties p ON sv.property_id = p.id
      WHERE sv.agent_id = $1
      ORDER BY date DESC
      LIMIT 10
    `;

    const recentActivity = await pool.query(recentActivityQuery, [agentId]);

    res.json({
      stats: stats.rows[0],
      monthlyCommission: monthlyRevenue.rows[0].monthly_commission,
      recentActivity: recentActivity.rows,
    });
  }),
);

/**
 * Gestión de clientes del agente
 */
router.get(
  '/agent/clients',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'agent') {
      throw new ApiError(403, 'Acceso denegado. Solo para agentes');
    }

    const agentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const clientsQuery = `
      SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.created_at,
        COUNT(DISTINCT pc.id) as contacts_count,
        COUNT(DISTINCT sv.id) as visits_count,
        COUNT(DISTINCT f.id) as favorites_count,
        MAX(pc.created_at) as last_contact
      FROM users u
      LEFT JOIN property_contacts pc ON u.id = pc.user_id
      LEFT JOIN scheduled_visits sv ON u.id = sv.user_id AND sv.agent_id = $1
      LEFT JOIN favorites f ON u.id = f.user_id
      LEFT JOIN properties p ON f.property_id = p.id AND p.agent_id = $1
      WHERE u.role = 'user' 
        AND (pc.property_id IN (SELECT id FROM properties WHERE agent_id = $1)
             OR sv.agent_id = $1
             OR f.property_id IN (SELECT id FROM properties WHERE agent_id = $1))
      GROUP BY u.id, u.name, u.email, u.phone, u.created_at
      ORDER BY last_contact DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `;

    const clients = await pool.query(clientsQuery, [agentId, limit, offset]);

    const totalQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN property_contacts pc ON u.id = pc.user_id
      LEFT JOIN scheduled_visits sv ON u.id = sv.user_id AND sv.agent_id = $1
      LEFT JOIN favorites f ON u.id = f.user_id
      LEFT JOIN properties p ON f.property_id = p.id AND p.agent_id = $1
      WHERE u.role = 'user' 
        AND (pc.property_id IN (SELECT id FROM properties WHERE agent_id = $1)
             OR sv.agent_id = $1
             OR f.property_id IN (SELECT id FROM properties WHERE agent_id = $1))
    `;

    const total = await pool.query(totalQuery, [agentId]);

    res.json({
      clients: clients.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: parseInt(total.rows[0].total, 10),
        totalPages: Math.ceil(total.rows[0].total / limit),
      },
    });
  }),
);

/**
 * Actualizar configuraciones específicas del agente
 */
router.put(
  '/agent/settings',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'agent') {
      throw new ApiError(403, 'Acceso denegado. Solo para agentes');
    }

    const agentId = req.user.id;
    const {
      commission_rate,
      availability_hours,
      specialties,
      service_areas,
      auto_accept_visits,
      notification_preferences,
    } = req.body;

    const agentSettings = {
      commission_rate,
      availability_hours,
      specialties,
      service_areas,
      auto_accept_visits,
      notification_preferences,
    };

    const result = await pool.query(
      `UPDATE users SET 
       preferences = COALESCE(preferences, '{}') || $1, 
       updated_at = NOW() 
       WHERE id = $2 
       RETURNING preferences`,
      [JSON.stringify(agentSettings), agentId],
    );

    res.json({
      message: 'Configuraciones del agente actualizadas exitosamente',
      settings: result.rows[0].preferences,
    });
  }),
);

// =================== RUTAS ESPECÍFICAS PARA USUARIOS ===================

/**
 * Dashboard del usuario - Actividad y favoritos
 */
router.get(
  '/user/dashboard',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'user') {
      throw new ApiError(403, 'Acceso denegado. Solo para usuarios');
    }

    const userId = req.user.id;

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
  }),
);

/**
 * Gestionar búsquedas guardadas del usuario
 */
router.post(
  '/user/saved-searches',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'user') {
      throw new ApiError(403, 'Acceso denegado. Solo para usuarios');
    }

    const userId = req.user.id;
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
  }),
);

/**
 * Actualizar preferencias del usuario
 */
router.put(
  '/user/preferences',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'user') {
      throw new ApiError(403, 'Acceso denegado. Solo para usuarios');
    }

    const userId = req.user.id;
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
  }),
);

module.exports = router;
