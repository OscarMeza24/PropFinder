const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new ApiError(401, "Token de acceso requerido"));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(new ApiError(403, "Token inválido o expirado"));
    }
    req.user = user;
    next();
  });
};

// Obtener todas las conversaciones del usuario (basado en mensajes directos)
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id; // Cambiado de userId a id

    // Consulta simplificada que funciona
    const query = `
    WITH user_conversations AS (
      SELECT DISTINCT
        CASE 
          WHEN sender_id = $1 THEN receiver_id
          ELSE sender_id
        END as other_user_id
      FROM messages 
      WHERE sender_id = $1 OR receiver_id = $1
    ),
    conversation_details AS (
      SELECT 
        uc.other_user_id,
        u.name as other_user_name,
        u.email as other_user_email,
        (
          SELECT content 
          FROM messages 
          WHERE (sender_id = $1 AND receiver_id = uc.other_user_id) 
             OR (sender_id = uc.other_user_id AND receiver_id = $1)
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at 
          FROM messages 
          WHERE (sender_id = $1 AND receiver_id = uc.other_user_id) 
             OR (sender_id = uc.other_user_id AND receiver_id = $1)
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) 
          FROM messages 
          WHERE receiver_id = $1 
            AND sender_id = uc.other_user_id 
            AND is_read = false
        ) as unread_count
      FROM user_conversations uc
      LEFT JOIN users u ON u.id = uc.other_user_id
    )
    SELECT * FROM conversation_details 
    ORDER BY last_message_time DESC NULLS LAST
  `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows,
    });
  })
);

// Obtener mensajes entre dos usuarios específicos
router.get(
  "/:otherUserId/messages",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id; // Cambiado de userId a id
    const otherUserId = req.params.otherUserId;

    // Verificar que el otro usuario existe
    const userQuery = "SELECT id, name FROM users WHERE id = $1";
    const userResult = await pool.query(userQuery, [otherUserId]);

    if (userResult.rows.length === 0) {
      return next(new ApiError(404, "Usuario no encontrado"));
    }

    // Obtener mensajes entre estos usuarios
    const messagesQuery = `
    SELECT 
      m.*,
      u.name as sender_name,
      u.email as sender_email
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = $1 AND m.receiver_id = $2)
       OR (m.sender_id = $2 AND m.receiver_id = $1)
    ORDER BY m.created_at ASC
  `;
    const messagesResult = await pool.query(messagesQuery, [
      userId,
      otherUserId,
    ]);

    // Marcar mensajes como leídos
    const markReadQuery = `
    UPDATE messages 
    SET is_read = true 
    WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
  `;
    await pool.query(markReadQuery, [userId, otherUserId]);

    res.json({
      success: true,
      data: {
        otherUser: userResult.rows[0],
        messages: messagesResult.rows,
      },
    });
  })
);

// Enviar mensaje entre usuarios
router.post(
  "/:otherUserId/messages",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id; // Cambiado de userId a id
    const otherUserId = req.params.otherUserId;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return next(new ApiError(400, "El contenido del mensaje es requerido"));
    }

    // Verificar que el otro usuario existe
    const userQuery = "SELECT id FROM users WHERE id = $1";
    const userResult = await pool.query(userQuery, [otherUserId]);

    if (userResult.rows.length === 0) {
      return next(new ApiError(404, "Usuario no encontrado"));
    }

    // Insertar mensaje
    const messageQuery = `
    INSERT INTO messages (sender_id, receiver_id, content, created_at, is_read)
    VALUES ($1, $2, $3, NOW(), false)
    RETURNING *
  `;
    const messageResult = await pool.query(messageQuery, [
      userId,
      otherUserId,
      content.trim(),
    ]);

    res.status(201).json({
      success: true,
      message: "Mensaje enviado exitosamente",
      data: messageResult.rows[0],
    });
  })
);

module.exports = router;
