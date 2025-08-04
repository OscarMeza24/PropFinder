const StripeStrategy = require('./StripeStrategy.js');
const PayPalStrategy = require('./PayPalStrategy.js');
const MercadoPagoStrategy = require('./MercadoPagoStrategy.js');
const ApiError = require('../../utils/ApiError.js');

class PaymentService {
  constructor() {
    this.strategies = new Map();
    this.initializeDefaultStrategies();
  }

  /**
   * Inicializa las estrategias de pago por defecto
   * @private
   */
  initializeDefaultStrategies() {
    // Estrategia para Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      this.registerStrategy('stripe', new StripeStrategy({
        apiKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      }));
    }

    // Estrategia para PayPal
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      this.registerStrategy('paypal', new PayPalStrategy({
        mode: process.env.PAYPAL_MODE || 'sandbox',
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      }));
    }

    // Estrategia para MercadoPago
    if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
      this.registerStrategy('mercadopago', new MercadoPagoStrategy({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      }));
    }
  }

  /**
   * Registra una nueva estrategia de pago
   * @param {string} name - Nombre de la estrategia (ej: 'stripe', 'paypal', 'mercadopago')
   * @param {PaymentStrategy} strategy - Instancia de la estrategia
   */
  registerStrategy(name, strategy) {
    if (this.strategies.has(name)) {
      console.warn(`La estrategia de pago '${name}' ya está registrada y será sobrescrita.`);
    }
    this.strategies.set(name, strategy);
    return this;
  }

  /**
   * Obtiene una estrategia de pago registrada
   * @param {string} name - Nombre de la estrategia
   * @returns {PaymentStrategy} - Instancia de la estrategia
   * @throws {ApiError} - Si la estrategia no está registrada
   */
  getStrategy(name) {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new ApiError(400, `Método de pago no soportado: ${name}`);
    }
    return strategy;
  }

  /**
   * Crea un pago utilizando la estrategia especificada
   * @param {string} provider - Proveedor de pago (ej: 'stripe', 'paypal', 'mercadopago')
   * @param {Object} paymentData - Datos del pago
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} - Resultado de la creación del pago
   */
  async createPayment(provider, paymentData, metadata = {}) {
    const strategy = this.getStrategy(provider);
    return strategy.createPayment(paymentData, metadata);
  }

  /**
   * Confirma un pago utilizando la estrategia especificada
   * @param {string} provider - Proveedor de pago
   * @param {string} paymentId - ID del pago
   * @param {Object} additionalData - Datos adicionales necesarios para confirmar el pago
   * @returns {Promise<Object>} - Resultado de la confirmación del pago
   */
  async confirmPayment(provider, paymentId, additionalData = {}) {
    const strategy = this.getStrategy(provider);
    return strategy.confirmPayment(paymentId, additionalData);
  }

  /**
   * Maneja una notificación webhook del proveedor de pagos
   * @param {string} provider - Proveedor de pago
   * @param {Object} request - Objeto de solicitud HTTP
   * @returns {Promise<Object>} - Respuesta al webhook
   */
  async handleWebhook(provider, request) {
    const strategy = this.getStrategy(provider);
    return strategy.handleWebhook(request);
  }

  /**
   * Obtiene el estado de un pago
   * @param {string} provider - Proveedor de pago
   * @param {string} paymentId - ID del pago
   * @returns {Promise<Object>} - Estado del pago
   */
  async getPaymentStatus(provider, paymentId) {
    const strategy = this.getStrategy(provider);
    return strategy.getPaymentStatus(paymentId);
  }

  /**
   * Obtiene la lista de proveedores de pago disponibles
   * @returns {string[]} - Nombres de los proveedores registrados
   */
  getAvailableProviders() {
    return Array.from(this.strategies.keys());
  }
}

// Exportar una instancia singleton del servicio de pagos
const paymentService = new PaymentService();
module.exports = paymentService;
