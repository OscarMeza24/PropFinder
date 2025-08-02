const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { pool } = require('../config/database.js');
const { authenticateToken } = require('../middleware/auth.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiError = require('../utils/ApiError.js');

const router = express.Router();

// Configurar PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

// Crear intento de pago con Stripe
router.post('/stripe/create-payment-intent', authenticateToken, asyncHandler(async (req, res) => {
  const {
    amount,
    currency = 'usd',
    propertyId,
    description,
  } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'El monto debe ser un valor positivo.');
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    description: description || 'Pago de PropFinder',
    metadata: {
      userId: req.user.userId,
      propertyId: propertyId || '',
    },
  });

  await pool.query(
    `INSERT INTO payments (user_id, property_id, amount, currency, payment_method, stripe_payment_intent_id, status) 
    VALUES ($1, $2, $3, $4, 'stripe', $5, 'pending')`,
    [req.user.userId, propertyId, amount, currency, paymentIntent.id],
  );

  res.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
}));

// Confirmar pago de Stripe
router.post('/stripe/confirm-payment', authenticateToken, asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    throw new ApiError(400, 'ID de Payment Intent requerido.');
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new ApiError(400, `El pago no se completó. Estado: ${paymentIntent.status}`);
  }

  await pool.query(
    "UPDATE payments SET status = 'completed', updated_at = NOW() WHERE stripe_payment_intent_id = $1",
    [paymentIntentId],
  );

  res.json({
    message: 'Pago confirmado exitosamente',
    status: 'completed',
  });
}));

// Crear pago con PayPal
router.post('/paypal/create-payment', authenticateToken, asyncHandler(async (req, res) => {
  const {
    amount,
    currency = 'USD',
    propertyId,
    description,
  } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'El monto debe ser un valor positivo.');
  }

  const create_payment_json = {
    intent: 'sale',
    payer: { payment_method: 'paypal' },
    redirect_urls: {
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    },
    transactions: [{
      item_list: {
        items: [{
          name: description || 'PropFinder Payment',
          sku: propertyId || 'item',
          price: amount.toFixed(2),
          currency,
          quantity: 1,
        }],
      },
      amount: {
        currency,
        total: amount.toFixed(2),
      },
      description: description || 'Pago de PropFinder',
    }],
  };

  const payment = await new Promise((resolve, reject) => {
    paypal.payment.create(create_payment_json, (error, p) => {
      if (error) {
        return reject(error);
      }
      return resolve(p);
    });
  });

  await pool.query(
    `INSERT INTO payments (user_id, property_id, amount, currency, payment_method, paypal_payment_id, status)
     VALUES ($1, $2, $3, $4, 'paypal', $5, 'pending')`,
    [req.user.userId, propertyId, amount, currency, payment.id],
  );

  const approvalUrl = payment.links.find((link) => link.rel === 'approval_url');
  if (!approvalUrl) {
    throw new ApiError(500, 'No se pudo obtener la URL de aprobación de PayPal.');
  }

  res.json({ paymentId: payment.id, approvalUrl: approvalUrl.href });
}));

// Ejecutar pago de PayPal
router.post('/paypal/execute-payment', authenticateToken, asyncHandler(async (req, res) => {
  const { paymentId, payerId } = req.body;

  if (!paymentId || !payerId) {
    throw new ApiError(400, 'Payment ID y Payer ID son requeridos.');
  }

  const execute_payment_json = { payer_id: payerId };

  const payment = await new Promise((resolve, reject) => {
    paypal.payment.execute(paymentId, execute_payment_json, (error, p) => {
      if (error) {
        return reject(error);
      }
      return resolve(p);
    });
  });

  if (payment.state !== 'approved') {
    throw new ApiError(400, `El pago no fue aprobado. Estado: ${payment.state}`);
  }

  await pool.query(
    'UPDATE payments SET status = $1, updated_at = NOW() WHERE paypal_payment_id = $2',
    ['completed', paymentId],
  );

  res.json({
    message: 'Pago ejecutado exitosamente',
    status: 'completed',
  });
}));

// Crear preferencia de pago con MercadoPago
router.post('/mercadopago/create-preference', authenticateToken, asyncHandler(async (req, res) => {
  const {
    amount,
    currency = 'ARS',
    propertyId,
    description,
  } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'El monto debe ser un valor positivo.');
  }

  const preference = {
    items: [{
      title: description || 'Pago de PropFinder',
      unit_price: parseFloat(amount),
      quantity: 1,
      currency_id: currency,
    }],
    back_urls: {
      success: `${process.env.FRONTEND_URL}/payment/success`,
      failure: `${process.env.FRONTEND_URL}/payment/cancel`,
      pending: `${process.env.FRONTEND_URL}/payment/pending`,
    },
    auto_return: 'approved',
    notification_url: `${process.env.BACKEND_URL}/api/payments/mercadopago/webhook`,
    external_reference: req.user.userId,
    metadata: {
      userId: req.user.userId,
      propertyId: propertyId || '',
    },
  };

  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  });
  const preferenceClient = new Preference(client);
  const mpResponse = await preferenceClient.create({ body: preference });

  await pool.query(
    `INSERT INTO payments (user_id, property_id, amount, currency, payment_method, mercadopago_preference_id, status)
     VALUES ($1, $2, $3, $4, 'mercadopago', $5, 'pending')`,
    [req.user.userId, propertyId, amount, currency, mpResponse.body.id],
  );

  res.json({
    preferenceId: mpResponse.body.id,
    initPoint: mpResponse.body.init_point,
  });
}));

// Feedback de pago de MercadoPago (redirección)
router.get('/mercadopago/feedback', asyncHandler(async (req, res) => {
  const { payment_id, status, preference_id } = req.query;

  let paymentStatus = 'failed';
  if (status === 'approved') {
    paymentStatus = 'completed';
  } else if (status === 'pending') {
    paymentStatus = 'pending';
  }

  await pool.query(
    'UPDATE payments SET status = $1, updated_at = NOW(), mercadopago_payment_id = $2 '
    + 'WHERE mercadopago_preference_id = $3',
    [paymentStatus, payment_id, preference_id],
  );

  // Redirigir al frontend con el estado del pago
  const redirectUrl = `${process.env.FRONTEND_URL}/payment/status?status=${paymentStatus}&payment_id=${payment_id}`;
  res.redirect(redirectUrl);
}));

// Webhook para MercadoPago
router.post('/mercadopago/webhook', asyncHandler(async (req, res) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });
    const preferenceId = payment.preference_id;

    if (preferenceId) {
      let paymentStatus = 'failed';
      if (payment.status === 'approved') {
        paymentStatus = 'completed';
      } else if (payment.status === 'pending') {
        paymentStatus = 'pending';
      }

      await pool.query(
        'UPDATE payments SET status = $1, updated_at = NOW(), mercadopago_payment_id = $2 '
        + 'WHERE mercadopago_preference_id = $3',
        [paymentStatus, paymentId, preferenceId],
      );
    }
  }

  res.status(200).send('OK');
}));

// Obtener historial de pagos del usuario
router.get('/history', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const paymentsQuery = pool.query(
    `SELECT p.*, pr.title as property_title
     FROM payments p
     LEFT JOIN properties pr ON p.property_id = pr.id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.userId, limit, offset],
  );

  const totalQuery = pool.query(
    'SELECT COUNT(*) as total FROM payments WHERE user_id = $1',
    [req.user.userId],
  );

  const [paymentsResult, totalResult] = await Promise.all([paymentsQuery, totalQuery]);

  const total = parseInt(totalResult.rows[0].total, 10);

  res.json({
    payments: paymentsResult.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

// Webhook para Stripe (para manejar eventos de pago)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    throw new ApiError(400, `Webhook Error: ${err.message}`);
  }

  const session = event.data.object;
  const eventType = event.type;

  console.log({ eventType, session });

  if (eventType === 'payment_intent.succeeded' || eventType === 'payment_intent.payment_failed') {
    const status = eventType === 'payment_intent.succeeded' ? 'completed' : 'failed';
    await pool.query(
      'UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_payment_intent_id = $2',
      [status, session.id],
    );
  }

  res.json({ received: true });
}));

module.exports = router;
