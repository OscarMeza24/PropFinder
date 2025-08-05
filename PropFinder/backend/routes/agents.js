const express = require('express');
const { pool } = require('../config/database.js');
const { authenticateAgent } = require('../middleware/auth.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiError = require('../utils/ApiError.js');

const router = express.Router();

// =================== DASHBOARD Y ESTADÍSTICAS DEL AGENTE ===================

/**
 * Dashboard del agente - Estadísticas completas
 */
router.get('/dashboard', authenticateAgent, asyncHandler(async (req, res) => {
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
      COALESCE(SUM(p.price * 0.03), 0) as monthly_commission,
      COUNT(*) as properties_sold_this_month
    FROM properties p
    WHERE p.agent_id = $1 
      AND p.status = 'sold' 
      AND p.updated_at >= DATE_TRUNC('month', CURRENT_DATE)
  `;

  const monthlyRevenue = await pool.query(monthlyRevenueQuery, [agentId]);

  // Propiedades más vistas
  const topPropertiesQuery = `
    SELECT id, title, price, views_count, status, created_at
    FROM properties
    WHERE agent_id = $1 AND status != 'deleted'
    ORDER BY views_count DESC
    LIMIT 5
  `;

  const topProperties = await pool.query(topPropertiesQuery, [agentId]);

  // Actividad reciente
  const recentActivityQuery = `
    SELECT 
      'property_created' as type,
      p.title as description,
      p.created_at as date,
      p.id as property_id
    FROM properties p
    WHERE p.agent_id = $1
    UNION ALL
    SELECT 
      'visit_scheduled' as type,
      'Visita programada para ' || p.title as description,
      sv.created_at as date,
      p.id as property_id
    FROM scheduled_visits sv
    JOIN properties p ON sv.property_id = p.id
    WHERE sv.agent_id = $1
    UNION ALL
    SELECT 
      'property_contact' as type,
      'Nuevo contacto para ' || p.title as description,
      pc.created_at as date,
      p.id as property_id
    FROM property_contacts pc
    JOIN properties p ON pc.property_id = p.id
    WHERE p.agent_id = $1
    ORDER BY date DESC
    LIMIT 15
  `;

  const recentActivity = await pool.query(recentActivityQuery, [agentId]);

  res.json({
    stats: stats.rows[0],
    monthlyRevenue: monthlyRevenue.rows[0],
    topProperties: topProperties.rows,
    recentActivity: recentActivity.rows,
  });
}));

/**
 * Analytics avanzado del agente
 */
router.get('/analytics', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const { period = '30' } = req.query; // días

  // Vistas por día en el período
  const viewsAnalyticsQuery = `
    SELECT 
      DATE(pv.viewed_at) as date,
      COUNT(*) as views,
      COUNT(DISTINCT pv.user_id) as unique_viewers
    FROM property_views pv
    JOIN properties p ON pv.property_id = p.id
    WHERE p.agent_id = $1 
      AND pv.viewed_at >= CURRENT_DATE - INTERVAL '${period} days'
    GROUP BY DATE(pv.viewed_at)
    ORDER BY date DESC
  `;

  const viewsAnalytics = await pool.query(viewsAnalyticsQuery, [agentId]);

  // Contactos por mes
  const contactsAnalyticsQuery = `
    SELECT 
      DATE_TRUNC('month', pc.created_at) as month,
      COUNT(*) as contacts,
      COUNT(DISTINCT pc.user_id) as unique_contacts
    FROM property_contacts pc
    JOIN properties p ON pc.property_id = p.id
    WHERE p.agent_id = $1
      AND pc.created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', pc.created_at)
    ORDER BY month DESC
  `;

  const contactsAnalytics = await pool.query(contactsAnalyticsQuery, [agentId]);

  // Rendimiento por tipo de propiedad
  const performanceByTypeQuery = `
    SELECT 
      property_type,
      COUNT(*) as total_properties,
      COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_properties,
      COALESCE(AVG(views_count), 0) as avg_views,
      COALESCE(AVG(price), 0) as avg_price
    FROM properties
    WHERE agent_id = $1 AND status != 'deleted'
    GROUP BY property_type
    ORDER BY total_properties DESC
  `;

  const performanceByType = await pool.query(performanceByTypeQuery, [agentId]);

  res.json({
    viewsAnalytics: viewsAnalytics.rows,
    contactsAnalytics: contactsAnalytics.rows,
    performanceByType: performanceByType.rows,
  });
}));

// =================== GESTIÓN DE CLIENTES ===================

/**
 * Gestión de clientes del agente
 */
router.get('/clients', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const { page = 1, limit = 10, search } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = `WHERE u.role = 'user' 
    AND (pc.property_id IN (SELECT id FROM properties WHERE agent_id = $1)
         OR sv.agent_id = $1
         OR f.property_id IN (SELECT id FROM properties WHERE agent_id = $1))`;

  const queryParams = [agentId];

  if (search) {
    whereClause += ' AND (u.name ILIKE $2 OR u.email ILIKE $2)';
    queryParams.push(`%${search}%`);
  }

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
    ${whereClause}
    GROUP BY u.id, u.name, u.email, u.phone, u.created_at
    ORDER BY last_contact DESC NULLS LAST
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
  `;

  queryParams.push(limit, offset);
  const clients = await pool.query(clientsQuery, queryParams);

  const totalQuery = `
    SELECT COUNT(DISTINCT u.id) as total
    FROM users u
    LEFT JOIN property_contacts pc ON u.id = pc.user_id
    LEFT JOIN scheduled_visits sv ON u.id = sv.user_id AND sv.agent_id = $1
    LEFT JOIN favorites f ON u.id = f.user_id
    LEFT JOIN properties p ON f.property_id = p.id AND p.agent_id = $1
    ${whereClause.replace(/LIMIT.*/, '')}
  `;

  const totalParams = queryParams.slice(0, -2); // Remove limit and offset
  const total = await pool.query(totalQuery, totalParams);

  res.json({
    clients: clients.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: parseInt(total.rows[0].total, 10),
      totalPages: Math.ceil(total.rows[0].total / limit),
    },
  });
}));

/**
 * Detalles de un cliente específico
 */
router.get('/clients/:clientId', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const { clientId } = req.params;

  // Información del cliente
  const clientQuery = `
    SELECT id, name, email, phone, created_at, preferences
    FROM users
    WHERE id = $1 AND role = 'user'
  `;

  const client = await pool.query(clientQuery, [clientId]);

  if (client.rows.length === 0) {
    throw new ApiError(404, 'Cliente no encontrado');
  }

  // Propiedades favoritas del cliente (del agente)
  const favoritesQuery = `
    SELECT p.id, p.title, p.price, p.address, p.city, p.images, f.created_at as favorited_at
    FROM favorites f
    JOIN properties p ON f.property_id = p.id
    WHERE f.user_id = $1 AND p.agent_id = $2 AND p.status = 'active'
    ORDER BY f.created_at DESC
  `;

  const favorites = await pool.query(favoritesQuery, [clientId, agentId]);

  // Visitas programadas
  const visitsQuery = `
    SELECT sv.id, sv.visit_date, sv.status, sv.notes, sv.created_at,
           p.title as property_title, p.address
    FROM scheduled_visits sv
    JOIN properties p ON sv.property_id = p.id
    WHERE sv.user_id = $1 AND sv.agent_id = $2
    ORDER BY sv.visit_date DESC
  `;

  const visits = await pool.query(visitsQuery, [clientId, agentId]);

  // Contactos del cliente
  const contactsQuery = `
    SELECT pc.id, pc.message, pc.contact_type, pc.status, pc.created_at,
           p.title as property_title
    FROM property_contacts pc
    JOIN properties p ON pc.property_id = p.id
    WHERE pc.user_id = $1 AND p.agent_id = $2
    ORDER BY pc.created_at DESC
  `;

  const contacts = await pool.query(contactsQuery, [clientId, agentId]);

  res.json({
    client: client.rows[0],
    favorites: favorites.rows,
    visits: visits.rows,
    contacts: contacts.rows,
  });
}));

// =================== GESTIÓN DE VISITAS ===================

/**
 * Obtener visitas programadas del agente
 */
router.get('/visits', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const { status, date, upcoming } = req.query;

  let whereClause = 'sv.agent_id = $1';
  const queryParams = [agentId];

  if (status) {
    whereClause += ' AND sv.status = $2';
    queryParams.push(status);
  }

  if (date) {
    whereClause += ` AND DATE(sv.visit_date) = $${queryParams.length + 1}`;
    queryParams.push(date);
  }

  if (upcoming === 'true') {
    whereClause += ' AND sv.visit_date > NOW()';
  }

  const visitsQuery = `
    SELECT 
      sv.id, sv.visit_date, sv.status, sv.notes, sv.created_at,
      p.id as property_id, p.title as property_title, p.address, p.city,
      u.id as client_id, u.name as client_name, u.email as client_email, u.phone as client_phone
    FROM scheduled_visits sv
    JOIN properties p ON sv.property_id = p.id
    JOIN users u ON sv.user_id = u.id
    WHERE ${whereClause}
    ORDER BY sv.visit_date ASC
  `;

  const visits = await pool.query(visitsQuery, queryParams);

  res.json({
    visits: visits.rows,
  });
}));

/**
 * Confirmar una visita
 */
router.put('/visits/:visitId/confirm', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const { visitId } = req.params;

  const result = await pool.query(
    `UPDATE scheduled_visits 
     SET status = 'confirmed', updated_at = NOW() 
     WHERE id = $1 AND agent_id = $2 AND status = 'pending'
     RETURNING *`,
    [visitId, agentId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Visita no encontrada o no se puede confirmar');
  }

  res.json({
    message: 'Visita confirmada exitosamente',
    visit: result.rows[0],
  });
}));

/**
 * Marcar visita como completada
 */
router.put('/visits/:visitId/complete', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const { visitId } = req.params;
  const { notes } = req.body;

  const result = await pool.query(
    `UPDATE scheduled_visits 
     SET status = 'completed', notes = COALESCE($1, notes), updated_at = NOW() 
     WHERE id = $2 AND agent_id = $3 AND status = 'confirmed'
     RETURNING *`,
    [notes, visitId, agentId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Visita no encontrada o no se puede marcar como completada');
  }

  res.json({
    message: 'Visita marcada como completada',
    visit: result.rows[0],
  });
}));

// =================== GESTIÓN DE CONTACTOS ===================

/**
 * Obtener contactos de propiedades del agente
 */
router.get('/property-contacts', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'p.agent_id = $1';
  const queryParams = [agentId];

  if (status) {
    whereClause += ' AND pc.status = $2';
    queryParams.push(status);
  }

  const contactsQuery = `
    SELECT 
      pc.id, pc.name, pc.email, pc.phone, pc.message, pc.contact_type, 
      pc.status, pc.created_at,
      p.id as property_id, p.title as property_title, p.address,
      u.id as user_id, u.name as user_name
    FROM property_contacts pc
    JOIN properties p ON pc.property_id = p.id
    LEFT JOIN users u ON pc.user_id = u.id
    WHERE ${whereClause}
    ORDER BY pc.created_at DESC
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
  `;

  queryParams.push(limit, offset);
  const contacts = await pool.query(contactsQuery, queryParams);

  const totalQuery = `
    SELECT COUNT(*) as total
    FROM property_contacts pc
    JOIN properties p ON pc.property_id = p.id
    WHERE ${whereClause}
  `;

  const totalParams = queryParams.slice(0, -2); // Remove limit and offset
  const total = await pool.query(totalQuery, totalParams);

  res.json({
    contacts: contacts.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: parseInt(total.rows[0].total, 10),
      totalPages: Math.ceil(total.rows[0].total / limit),
    },
  });
}));

/**
 * Actualizar estado de un contacto
 */
router.put('/property-contacts/:contactId', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const { contactId } = req.params;
  const { status } = req.body;

  if (!['pending', 'contacted', 'closed'].includes(status)) {
    throw new ApiError(400, 'Estado inválido');
  }

  const result = await pool.query(
    `UPDATE property_contacts pc
     SET status = $1, updated_at = NOW() 
     FROM properties p
     WHERE pc.property_id = p.id 
       AND pc.id = $2 
       AND p.agent_id = $3
     RETURNING pc.*`,
    [status, contactId, agentId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Contacto no encontrado');
  }

  res.json({
    message: 'Estado del contacto actualizado exitosamente',
    contact: result.rows[0],
  });
}));

// =================== CONFIGURACIONES DEL AGENTE ===================

/**
 * Obtener configuraciones del agente
 */
router.get('/settings', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;

  const result = await pool.query(
    'SELECT preferences FROM users WHERE id = $1',
    [agentId],
  );

  res.json({
    settings: result.rows[0].preferences || {},
  });
}));

/**
 * Actualizar configuraciones específicas del agente
 */
router.put('/settings', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const {
    commission_rate,
    availability_hours,
    specialties,
    service_areas,
    auto_accept_visits,
    notification_preferences,
    contact_info,
  } = req.body;

  const agentSettings = {
    commission_rate,
    availability_hours,
    specialties,
    service_areas,
    auto_accept_visits,
    notification_preferences,
    contact_info,
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
}));

/**
 * Perfil del agente con estadísticas
 */
router.get('/profile', authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.id;

  // Información básica del agente
  const agentQuery = `
    SELECT id, email, name, phone, avatar_url, created_at, preferences
    FROM users
    WHERE id = $1
  `;

  const agent = await pool.query(agentQuery, [agentId]);

  // Estadísticas del agente
  const statsQuery = `
    SELECT 
      COUNT(p.id) as total_properties,
      COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_properties,
      COUNT(CASE WHEN p.status = 'sold' THEN 1 END) as sold_properties,
      COALESCE(SUM(p.views_count), 0) as total_views,
      COUNT(DISTINCT sv.user_id) as total_clients,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(r.id) as total_reviews
    FROM properties p
    LEFT JOIN scheduled_visits sv ON p.id = sv.property_id
    LEFT JOIN reviews r ON p.id = r.property_id
    WHERE p.agent_id = $1 AND p.status != 'deleted'
  `;

  const stats = await pool.query(statsQuery, [agentId]);

  // Reseñas recientes
  const recentReviewsQuery = `
    SELECT r.rating, r.comment, r.created_at,
           u.name as reviewer_name,
           p.title as property_title
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN properties p ON r.property_id = p.id
    WHERE r.agent_id = $1
    ORDER BY r.created_at DESC
    LIMIT 5
  `;

  const recentReviews = await pool.query(recentReviewsQuery, [agentId]);

  res.json({
    agent: agent.rows[0],
    stats: stats.rows[0],
    recentReviews: recentReviews.rows,
  });
}));

module.exports = router;
