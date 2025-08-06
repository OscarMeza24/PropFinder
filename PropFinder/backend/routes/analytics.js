const express = require('express');
const { authenticateAgent } = require('../middleware/auth.js');
const { pool } = require('../config/database.js');
const { logDatabase } = require('../config/logger.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiError = require('../utils/ApiError.js');

const router = express.Router();

// Obtener estadísticas generales (solo agentes)
router.get('/dashboard', ...authenticateAgent, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const agentId = req.user.userId;

  const queries = [
    pool.query(`SELECT COUNT(*) as total_properties,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_properties,
      COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_properties,
      COUNT(CASE WHEN status = 'rented' THEN 1 END) as rented_properties,
      AVG(price) as avg_price,
      MIN(price) as min_price,
      MAX(price) as max_price
      FROM properties WHERE agent_id = $1 AND status != 'deleted'`, [agentId]),
    pool.query(`SELECT COUNT(*) as total_visits,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_visits,
      COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_visits,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_visits
      FROM scheduled_visits WHERE agent_id = $1`, [agentId]),
    pool.query(`SELECT COUNT(*) as total_messages,
      COUNT(DISTINCT sender_id) as unique_senders,
      COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_messages
      FROM messages WHERE receiver_id = $1`, [agentId]),
    pool.query(`SELECT COUNT(*) as total_favorites,
      FROM favorites f JOIN properties p ON f.property_id = p.id WHERE p.agent_id = $1`, [agentId]),
    pool.query(`SELECT COUNT(*) as total_payments,
      SUM(amount) as total_revenue,
      AVG(amount) as avg_payment
      FROM payments WHERE property_id IN (SELECT id FROM properties WHERE agent_id = $1) 
      AND status = 'completed'`, [agentId]),
  ];

  const [propertyStats, visitStats, messageStats, favoriteStats, paymentStats] = await Promise.all(queries);

  logDatabase('SELECT', 'analytics_dashboard', Date.now() - startTime, true);

  res.json({
    propertyStats: propertyStats.rows[0],
    visitStats: visitStats.rows[0],
    messageStats: messageStats.rows[0],
    favoriteStats: favoriteStats.rows[0],
    paymentStats: paymentStats.rows[0],
  });
}));

// Obtener propiedades más vistas (por favoritos)
router.get('/top-properties', ...authenticateAgent, asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const agentId = req.user.userId;

  const result = await pool.query(`
    SELECT 
      p.id, p.title, p.price, p.address, p.city, p.status,
      COUNT(f.id) as favorite_count,
      COUNT(sv.id) as visit_count
    FROM properties p
    LEFT JOIN favorites f ON p.id = f.property_id
    LEFT JOIN scheduled_visits sv ON p.id = sv.property_id
    WHERE p.agent_id = $1 AND p.status != 'deleted'
    GROUP BY p.id
    ORDER BY favorite_count DESC, visit_count DESC
    LIMIT $2
  `, [agentId, limit]);

  res.json({ topProperties: result.rows });
}));

// Obtener actividad reciente
router.get('/recent-activity', ...authenticateAgent, asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const agentId = req.user.userId;

  const result = await pool.query(`
    SELECT type, activity_date, user_name, user_email, property_title, activity_description FROM (
      (SELECT 'message' as type, m.created_at as activity_date, u.name as user_name, u.email as user_email,
      p.title as property_title, m.content as activity_description
      FROM messages m JOIN users u ON m.sender_id = u.id LEFT JOIN properties p ON m.property_id = p.id
      WHERE m.receiver_id = $1)
      UNION ALL
      (SELECT 'visit' as type, sv.created_at as activity_date, u.name as user_name, u.email as user_email,
      p.title as property_title, 'Programó una visita para ' || p.title as activity_description
      FROM scheduled_visits sv JOIN users u ON sv.user_id = u.id JOIN properties p ON sv.property_id = p.id
      WHERE sv.agent_id = $1)
      UNION ALL
      (SELECT 'favorite' as type, f.created_at as activity_date, u.name as user_name, u.email as user_email,
      p.title as property_title, 'Agregó ' || p.title || ' a favoritos' as activity_description
      FROM favorites f JOIN users u ON f.user_id = u.id JOIN properties p ON f.property_id = p.id
      WHERE p.agent_id = $1)
    ) as activities
    ORDER BY activity_date DESC
    LIMIT $2
  `, [agentId, limit]);

  res.json({ recentActivity: result.rows });
}));

// Obtener estadísticas por período
router.get('/period-stats', ...authenticateAgent, asyncHandler(async (req, res) => {
  const { period = '30', start_date, end_date } = req.query;
  const agentId = req.user.userId;

  let dateFilter = '';
  const queryParams = [agentId];

  if (start_date && end_date) {
    dateFilter = 'AND created_at BETWEEN $2 AND $3';
    queryParams.push(start_date, end_date);
  } else {
    const parsedPeriod = parseInt(period, 10);
    if (Number.isNaN(parsedPeriod) || parsedPeriod <= 0) {
      throw new ApiError(400, 'El período debe ser un número positivo.');
    }
    dateFilter = `AND created_at >= NOW() - INTERVAL '${parsedPeriod} days'`;
  }

  const propertyStatsPromise = pool.query(`SELECT DATE(created_at) as date,
    COUNT(*) as new_properties,
    COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_properties,
    COUNT(CASE WHEN status = 'rented' THEN 1 END) as rented_properties
    FROM properties WHERE agent_id = $1 ${dateFilter} GROUP BY DATE(created_at) ORDER BY date DESC`, queryParams);
  const visitStatsPromise = pool.query(`SELECT DATE(created_at) as date,
    COUNT(*) as total_visits,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_visits,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_visits
    FROM scheduled_visits WHERE agent_id = $1 ${dateFilter} GROUP BY DATE(created_at) ORDER BY date DESC`, queryParams);
  const messageStatsPromise = pool.query(`SELECT DATE(created_at) as date,
    COUNT(*) as total_messages,
    COUNT(DISTINCT sender_id) as unique_senders
    FROM messages WHERE receiver_id = $1 ${dateFilter} GROUP BY DATE(created_at) ORDER BY date DESC`, queryParams);

  const [propertyStats, visitStats, messageStats] = await Promise.all([
    propertyStatsPromise,
    visitStatsPromise,
    messageStatsPromise,
  ]);

  res.json({
    propertyStats: propertyStats.rows,
    visitStats: visitStats.rows,
    messageStats: messageStats.rows,
  });
}));

// Obtener leads más activos
router.get('/top-leads', ...authenticateAgent, asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const agentId = req.user.userId;

  const result = await pool.query(`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.phone,
      COUNT(DISTINCT f.property_id) as favorite_count,
      COUNT(DISTINCT sv.property_id) as visit_count,
      COUNT(m.id) as message_count,
      MAX(m.created_at) as last_contact
    FROM users u
    LEFT JOIN favorites f ON u.id = f.user_id AND f.property_id IN (SELECT id FROM properties WHERE agent_id = $1)
    LEFT JOIN scheduled_visits sv ON u.id = sv.user_id AND sv.agent_id = $1
    LEFT JOIN messages m ON u.id = m.sender_id AND m.receiver_id = $1
    WHERE f.id IS NOT NULL OR sv.id IS NOT NULL OR m.id IS NOT NULL
    GROUP BY u.id
    ORDER BY (COUNT(DISTINCT f.id) + COUNT(DISTINCT sv.id) + COUNT(DISTINCT m.id)) DESC
    LIMIT $2
  `, [agentId, limit]);

  res.json({ topLeads: result.rows });
}));

// Obtener métricas de rendimiento
router.get('/performance', ...authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.userId;

  const conversionRatePromise = pool.query(`
    SELECT 
      COUNT(DISTINCT sv.user_id) as total_visitors,
      COUNT(DISTINCT CASE WHEN p.status IN ('sold', 'rented') THEN sv.user_id END) as converted_visitors,
      CASE WHEN COUNT(DISTINCT sv.user_id) > 0 
      THEN ROUND((COUNT(DISTINCT CASE WHEN p.status IN ('sold', 'rented') THEN sv.user_id END)::DECIMAL / 
      COUNT(DISTINCT sv.user_id)) * 100, 2) 
      ELSE 0 END as conversion_rate
      FROM scheduled_visits sv
      LEFT JOIN properties p ON sv.property_id = p.id
      WHERE sv.agent_id = $1
  `, [agentId]);

  const responseTimePromise = pool.query(`
    SELECT AVG(EXTRACT(EPOCH FROM (m2.created_at - m1.created_at))/3600) as avg_response_hours
    FROM messages m1
    JOIN (SELECT receiver_id,
    sender_id,
    MIN(created_at) as created_at
    FROM messages
    GROUP BY receiver_id, sender_id) m2 
    ON m1.sender_id = m2.receiver_id AND m1.receiver_id = m2.sender_id AND m2.created_at > m1.created_at
    WHERE m1.receiver_id = $1
  `, [agentId]);

  const popularPropertiesPromise = pool.query(`
    SELECT p.title,
    COUNT(f.id) as favorite_count,
    COUNT(sv.id) as visit_count,
    (COUNT(f.id) + COUNT(sv.id)) as total_engagement
    FROM properties p
    LEFT JOIN favorites f ON p.id = f.property_id
    LEFT JOIN scheduled_visits sv ON p.id = sv.property_id
    WHERE p.agent_id = $1 AND p.status != 'deleted'
    GROUP BY p.id
    ORDER BY total_engagement DESC
    LIMIT 5
  `, [agentId]);

  const [
    conversionRate,
    responseTime,
    popularProperties] = await Promise.all([conversionRatePromise, responseTimePromise, popularPropertiesPromise]);

  res.json({
    conversionRate: conversionRate.rows[0],
    responseTime: responseTime.rows[0],
    popularProperties: popularProperties.rows,
  });
}));

// Obtener actividad semanal para el gráfico
router.get('/weekly-activity', ...authenticateAgent, asyncHandler(async (req, res) => {
  const agentId = req.user.userId;

  const query = `
    WITH date_series AS (
      SELECT generate_series(
        current_date - interval '6 days',
        current_date,
        '1 day'
      )::date AS day
    ),
    daily_views AS (
      SELECT
        v.created_at::date AS day,
        COUNT(v.id) AS view_count
      FROM property_views v
      JOIN properties p ON v.property_id = p.id
      WHERE p.agent_id = $1 AND v.created_at >= current_date - interval '6 days'
      GROUP BY v.created_at::date
    ),
    daily_messages AS (
      SELECT
        m.created_at::date AS day,
        COUNT(m.id) AS message_count
      FROM messages m
      WHERE m.receiver_id = $1 AND m.created_at >= current_date - interval '6 days'
      GROUP BY m.created_at::date
    )
    SELECT
      -- Formatear el día de la semana en español
      CASE 
        WHEN to_char(ds.day, 'DY') = 'MON' THEN 'Lunes'
        WHEN to_char(ds.day, 'DY') = 'TUE' THEN 'Martes'
        WHEN to_char(ds.day, 'DY') = 'WED' THEN 'Miércoles'
        WHEN to_char(ds.day, 'DY') = 'THU' THEN 'Jueves'
        WHEN to_char(ds.day, 'DY') = 'FRI' THEN 'Viernes'
        WHEN to_char(ds.day, 'DY') = 'SAT' THEN 'Sábado'
        WHEN to_char(ds.day, 'DY') = 'SUN' THEN 'Domingo'
      END as name,
      COALESCE(dv.view_count, 0)::int AS vistas,
      COALESCE(dm.message_count, 0)::int AS mensajes
    FROM date_series ds
    LEFT JOIN daily_views dv ON ds.day = dv.day
    LEFT JOIN daily_messages dm ON ds.day = dm.day
    ORDER BY ds.day;
  `;

  const result = await pool.query(query, [agentId]);

  res.json(result.rows);
}));

module.exports = router;
