const stripe = require('stripe');
const PaymentStrategy = require('./PaymentStrategy.js');

class StripeStrategy extends PaymentStrategy {
  constructor(apiKey) {
    super({ apiKey });
    this.stripe = stripe(apiKey);
  }

  /**
   * Crea un Payment Intent de Stripe
   * @param {Object} paymentData - Datos del pago
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} - Resultado de la creación del pago
   */
  async createPayment(paymentData, metadata = {}) {
    const { amount, currency = 'usd', description } = paymentData;

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency,
        description: description || 'Pago de PropFinder',
        metadata: {
          ...metadata,
          integration: 'propfinder',
        },
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        paymentMethod: 'stripe',
        requiresAction: paymentIntent.status === 'requires_action',
        requiresConfirmation: paymentIntent.status === 'requires_confirmation',
        additionalData: {
          paymentIntentId: paymentIntent.id,
        },
      };
    } catch (error) {
      console.error('Error al crear pago con Stripe:', error);
      throw new Error(`Error al procesar el pago con Stripe: ${error.message}`);
    }
  }

  /**
   * Confirma un pago de Stripe
   * @param {string} paymentId - ID del pago a confirmar
   * @param {Object} additionalData - Datos adicionales
   * @returns {Promise<Object>} - Resultado de la confirmación
   */
  async confirmPayment(paymentId, _additionalData = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          status: 'completed',
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convertir a unidades estándar
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        };
      }

      return {
        success: false,
        status: paymentIntent.status,
        error: `El pago no se completó. Estado: ${paymentIntent.status}`,
      };
    } catch (error) {
      console.error('Error al confirmar pago con Stripe:', error);
      throw new Error(`Error al confirmar el pago con Stripe: ${error.message}`);
    }
  }

  /**
   * Maneja el webhook de Stripe
   * @param {Object} request - Objeto de solicitud HTTP
   * @returns {Promise<Object>} - Respuesta al webhook
   */
  async handleWebhook(request) {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
      event = this.stripe.webhooks.constructEvent(
        request.body,
        sig,
        this.config.webhookSecret,
      );
    } catch (err) {
      console.error('Error al verificar la firma del webhook de Stripe:', err);
      throw new Error(`Error en el webhook: ${err.message}`);
    }

    const paymentIntent = event.data.object;
    let status = 'pending';

    switch (event.type) {
      case 'payment_intent.succeeded':
        status = 'completed';
        break;
      case 'payment_intent.payment_failed':
        status = 'failed';
        break;
      default:
        // Otros eventos no manejados
        return { received: true };
    }

    return {
      paymentId: paymentIntent.id,
      status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    };
  }

  /**
   * Obtiene el estado de un pago de Stripe
   * @param {string} paymentId - ID del pago
   * @returns {Promise<Object>} - Estado del pago
   */
  async getPaymentStatus(paymentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
        requiresAction: paymentIntent.status === 'requires_action',
        requiresConfirmation: paymentIntent.status === 'requires_confirmation',
        paymentMethod: 'stripe',
      };
    } catch (error) {
      console.error('Error al obtener estado de pago de Stripe:', error);
      throw new Error(`Error al obtener el estado del pago: ${error.message}`);
    }
  }
}

module.exports = StripeStrategy;
