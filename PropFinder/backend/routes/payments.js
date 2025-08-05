const express = require('express');
const { pool } = require('../config/database.js');
const { authenticateToken } = require('../middleware/auth.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiError = require('../utils/ApiError.js');
const paymentService = require('../services/payment/PaymentService.js');

const router = express.Router();

// Ruta para crear un pago con cualquier proveedor
router.post(
  '/create-payment',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      provider,
      amount,
      currency,
      description,
      returnUrl,
      cancelUrl,
      propertyId,
    } = req.body;

    if (!provider || !amount || amount <= 0) {
      throw new ApiError(400, 'Proveedor y monto válido son requeridos.');
    }

    // Crear el pago utilizando el servicio de pagos
    const paymentData = {
      amount,
      currency: currency || (provider === 'mercadopago' ? 'ARS' : 'USD'),
      description,
      returnUrl,
      cancelUrl,
    };

    const metadata = {
      propertyId,
      userId: req.user.id,
      userEmail: req.user.email,
    };

    const result = await paymentService.createPayment(
      provider,
      paymentData,
      metadata,
    );

    // Guardar información del pago en la base de datos
    const paymentMethod = provider.toLowerCase();
    const paymentId = result.id;

    // Mapear campos específicos de cada proveedor
    const paymentFields = {
      stripe_payment_intent_id: provider === 'stripe' ? paymentId : null,
      paypal_payment_id: provider === 'paypal' ? paymentId : null,
      mercadopago_preference_id: provider === 'mercadopago' ? paymentId : null,
    };

    const fieldNames = [];
    const fieldValues = [];
    const valuePlaceholders = [];
    let paramIndex = 1;

    // Agregar campos fijos
    fieldNames.push(
      'user_id',
      'property_id',
      'amount',
      'currency',
      'payment_method',
      'status',
    );
    fieldValues.push(
      req.user.id,
      propertyId,
      amount,
      paymentData.currency,
      paymentMethod,
      'pending',
    );
    valuePlaceholders.push(
      `$${paramIndex++}`,
      `$${paramIndex++}`,
      `$${paramIndex++}`,
      `$${paramIndex++}`,
      `$${paramIndex++}`,
      `$${paramIndex++}`,
    );

    // Agregar campos específicos del proveedor
    Object.entries(paymentFields).forEach(([field, value]) => {
      if (value !== null) {
        fieldNames.push(field);
        fieldValues.push(value);
        valuePlaceholders.push(`$${paramIndex++}`);
      }
    });

    // Insertar en la base de datos
    const query = `
    INSERT INTO payments (${fieldNames.join(', ')})
    VALUES (${valuePlaceholders.join(', ')})
    RETURNING *
  `;

    const dbResult = await pool.query(query, fieldValues);
    const paymentRecord = dbResult.rows[0];

    // Devolver el resultado del pago junto con la información de la base de datos
    res.json({
      ...result,
      paymentRecordId: paymentRecord.id,
    });
  }),
);

// Ruta para confirmar un pago (para métodos que requieren confirmación en dos pasos)
router.post(
  '/confirm-payment',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { provider, paymentId, additionalData = {} } = req.body;

    if (!provider || !paymentId) {
      throw new ApiError(400, 'Proveedor y ID de pago son requeridos.');
    }

    // Confirmar el pago utilizando el servicio de pagos
    const result = await paymentService.confirmPayment(
      provider,
      paymentId,
      additionalData,
    );

    // Actualizar el estado del pago en la base de datos
    const updateFields = ['status = $1', 'updated_at = NOW()'];
    const updateValues = [result.status, paymentId];

    // Agregar campos específicos del proveedor
    let condition = '';
    switch (provider) {
      case 'stripe':
        condition = 'stripe_payment_intent_id = $2';
        break;
      case 'paypal':
        condition = 'paypal_payment_id = $2';
        break;
      case 'mercadopago':
        condition = 'mercadopago_preference_id = $2';
        // Actualizar también con el ID de pago real de MercadoPago si está disponible
        if (additionalData.paymentId) {
          updateFields.push('mercadopago_payment_id = $3');
          updateValues.push(additionalData.paymentId);
        }
        break;
      default:
        throw new ApiError(400, 'Proveedor de pago no soportado');
    }

    const query = `
    UPDATE payments
    SET ${updateFields.join(', ')}
    WHERE ${condition}
    RETURNING *
  `;

    await pool.query(query, updateValues);

    res.json(result);
  }),
);

// Ruta para manejar webhooks de los proveedores de pago
router.post(
  '/webhook/:provider',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const { provider } = req.params;

    try {
      // Procesar el webhook utilizando el servicio de pagos
      const result = await paymentService.handleWebhook(provider, req);

      // Si el webhook incluye información de pago, actualizar la base de datos
      if (result.paymentId) {
        const { paymentId, status } = result;
        let condition = '';
        const queryParams = [status, paymentId];

        switch (provider) {
          case 'stripe':
            condition = 'stripe_payment_intent_id = $2';
            break;
          case 'paypal':
            condition = 'paypal_payment_id = $2';
            break;
          case 'mercadopago':
            condition = 'mercadopago_preference_id = $2 OR mercadopago_payment_id = $2';
            break;
          default:
            throw new Error('Proveedor no soportado');
        }

        const query = `
        UPDATE payments
        SET status = $1, updated_at = NOW()
        WHERE ${condition}
      `;

        await pool.query(query, queryParams);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error(`Error en webhook de ${provider}:`, error);
      res.status(400).json({ error: error.message });
    }
  }),
);

// Ruta para obtener el estado de un pago
router.get(
  '/status/:provider/:paymentId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { provider, paymentId } = req.params;

    // Obtener el estado del pago utilizando el servicio de pagos
    const status = await paymentService.getPaymentStatus(provider, paymentId);

    // Obtener información adicional de la base de datos
    let condition = '';
    switch (provider) {
      case 'stripe':
        condition = 'stripe_payment_intent_id = $1';
        break;
      case 'paypal':
        condition = 'paypal_payment_id = $1';
        break;
      case 'mercadopago':
        condition = 'mercadopago_preference_id = $1 OR mercadopago_payment_id = $1';
        break;
      default:
        throw new ApiError(400, 'Proveedor de pago no soportado');
    }

    const query = `
    SELECT * FROM payments
    WHERE ${condition}
    AND user_id = $2
  `;

    const dbResult = await pool.query(query, [paymentId, req.user.id]);

    if (dbResult.rows.length === 0) {
      throw new ApiError(404, 'Pago no encontrado');
    }

    const paymentRecord = dbResult.rows[0];

    res.json({
      ...status,
      paymentRecord,
    });
  }),
);

// Ruta para obtener el historial de pagos del usuario
router.get(
  '/history',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Validar parámetros
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (Number.isNaN(pageNum) || pageNum < 1 || Number.isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ApiError(400, 'Parámetros de paginación inválidos');
    }

    // Obtener pagos del usuario con paginación
    const paymentsQuery = pool.query(
      `SELECT p.*, pr.title as property_title
     FROM payments p
     LEFT JOIN properties pr ON p.property_id = pr.id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
      [req.user.id, limitNum, offset],
    );

    // Obtener el total de pagos para la paginación
    const totalQuery = pool.query(
      'SELECT COUNT(*) as total FROM payments WHERE user_id = $1',
      [req.user.id],
    );

    const [paymentsResult, totalResult] = await Promise.all([
      paymentsQuery,
      totalQuery,
    ]);
    const total = parseInt(totalResult.rows[0].total, 10);

    res.json({
      payments: paymentsResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }),
);

// Ruta para obtener los proveedores de pago disponibles
router.get('/providers', (req, res) => {
  const providers = paymentService.getAvailableProviders();
  res.json({ providers });
});

module.exports = router;
