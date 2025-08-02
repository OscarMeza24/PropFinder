const express = require('express');
const { authenticateToken } = require('../middleware/auth.js');
const { pool, redisClient } = require('../config/database.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiError = require('../utils/ApiError.js');

const router = express.Router();

// Obtener notificaciones del usuario
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;
    const { userId } = req.user;

    // Usar un array para construir las condiciones WHERE de forma segura
    const whereConditions = ['user_id = $1'];
    const queryParams = [userId];

    if (unread_only === 'true') {
      whereConditions.push('is_read = FALSE');
    }

    const whereClause = whereConditions.join(' AND ');

    // Construir consultas finales usando el WHERE clause
    const query = `SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    const countQuery = `SELECT COUNT(*) FROM notifications WHERE ${whereClause}`;
    const finalQueryParams = [...queryParams, limit, offset];

    const [result, countResult] = await Promise.all([
      pool.query(query, finalQueryParams),
      pool.query(countQuery, [userId]),
    ]);

    res.json({
      notifications: result.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: parseInt(countResult.rows[0].count, 10),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  }),
);

// Marcar notificación como leída
router.put(
  '/:id/read',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId],
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Notificación no encontrada o no autorizada');
    }

    res.json({
      message: 'Notificación marcada como leída',
      notification: result.rows[0],
    });
  }),
);

// Marcar todas las notificaciones como leídas
router.put(
  '/read-all',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, 
           read_at = NOW() 
       WHERE user_id = $1 
       AND is_read = FALSE 
       RETURNING COUNT(*)`,

      [req.user.userId],
    );

    res.json({
      message: 'Todas las notificaciones marcadas como leídas',
      count: parseInt(result.rows[0].count, 10),
    });
  }),
);

// Eliminar notificación
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId],
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, 'Notificación no encontrada o no autorizada');
    }

    res.status(204).send();
  }),
);

// Obtener contador de notificaciones no leídas
router.get(
  '/unread-count',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.userId],
    );

    res.json({
      unreadCount: parseInt(result.rows[0].count, 10),
    });
  }),
);

// Función para crear notificación (usada internamente)
const createNotification = async (
  userId,
  title,
  message,
  type = 'info',
  data = {},
) => {
  const query = `
    INSERT INTO notifications (user_id, title, message, type, data, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  const result = await pool.query(query, [
    userId,
    title,
    message,
    type,
    JSON.stringify(data),
  ]);

  const notification = result.rows[0];

  // La lógica de WebSocket para notificaciones en tiempo real se manejaría aquí o
  // a través de un sistema de pub/sub para desacoplar los componentes.
  // Por ejemplo, emitiendo un evento a Redis que el servidor WebSocket escucha.
  redisClient.publish(
    'notifications',
    JSON.stringify({ userId, notification }),
  );

  return notification;
};

// Función para crear notificación de nuevo mensaje
const createMessageNotification = (receiverId, senderName, messagePreview) => createNotification(
  receiverId,
  'Nuevo mensaje',
  `${senderName} te envió un mensaje: ${messagePreview.substring(0, 50)}...`,
  'message',
  { type: 'new_message' },
);

// Función para crear notificación de nueva visita programada
const createVisitNotification = (agentId, userName, propertyTitle, visitDate) => createNotification(
  agentId,
  'Visita programada',
  `${userName} ha programado una visita para ${propertyTitle} el ${new Date(visitDate).toLocaleDateString()}`,
  'visit',
  { type: 'new_visit' },
);

// Función para crear notificación de pago recibido
const createPaymentNotification = (agentId, amount, currency, propertyTitle) => createNotification(
  agentId,
  'Pago recibido',
  `Has recibido un pago de ${amount} ${currency} por la propiedad ${propertyTitle}`,
  'payment',
  { type: 'payment_received' },
);

// Función para crear notificación de propiedad favorita
const createFavoriteNotification = (agentId, userName, propertyTitle) => createNotification(
  agentId,
  'Propiedad agregada a favoritos',
  `${userName} agregó "${propertyTitle}" a sus favoritos`,
  'favorite',
  { type: 'property_favorited' },
);

module.exports = {
  router,
  createNotification,
  createMessageNotification,
  createVisitNotification,
  createPaymentNotification,
  createFavoriteNotification,
};
