const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const PaymentStrategy = require('./PaymentStrategy.js');

const mapMercadoPagoStatus = (mercadopagoStatus) => {
  const statusMap = {
    pending: 'pending',
    approved: 'completed',
    authorized: 'pending',
    in_process: 'pending',
    in_mediation: 'pending',
    rejected: 'failed',
    cancelled: 'cancelled',
    refunded: 'refunded',
    charged_back: 'refunded',
  };
  return statusMap[mercadopagoStatus] || 'unknown';
};

class MercadoPagoStrategy extends PaymentStrategy {
  constructor(config) {
    super(config);
    // Configurar SDK de MercadoPago
    const client = new MercadoPagoConfig({
      accessToken: config.accessToken,
      options: { timeout: 5000 },
    });
    this.preferenceClient = new Preference(client);
    this.paymentClient = new Payment(client);
  }

  /**
   * Crea una preferencia de pago de MercadoPago
   * @param {Object} paymentData - Datos del pago
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} - Resultado de la creación de la preferencia
   */
  async createPayment(paymentData, metadata = {}) {
    const { amount, currency = 'ARS', description } = paymentData;
    const { propertyId, userId } = metadata;
    try {
      const preference = {
        items: [{
          title: description || 'Pago de PropFinder',
          unit_price: parseFloat(amount),
          quantity: 1,
          currency_id: currency,
        }],
        back_urls: {
          success: `${process.env.FRONTEND_URL}/payment/success`,
          failure: `${process.env.FRONTEND_URL}/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/api/payments/mercadopago/webhook`,
        external_reference: userId ? String(userId) : undefined,
        metadata: {
          ...metadata,
          integration: 'propfinder',
          propertyId: propertyId ? String(propertyId) : undefined,
        },
      };
      const response = await this.preferenceClient.create({ body: preference });
      return {
        id: response.id,
        status: 'pending',
        paymentMethod: 'mercadopago',
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point,
        requiresApproval: true,
        additionalData: {
          preferenceId: response.id,
          externalReference: response.external_reference,
        },
      };
    } catch (error) {
      console.error('Error al crear preferencia de pago con MercadoPago:', error);
      throw new Error(`Error al procesar el pago con MercadoPago: ${error.message}`);
    }
  }

  /**
   * Confirma un pago de MercadoPago
   * @param {string} paymentId - ID del pago a confirmar
   * @param {Object} additionalData - Datos adicionales
   * @returns {Promise<Object>} - Resultado de la confirmación
   */
  async confirmPayment(paymentId, _additionalData = {}) {
    try {
      const payment = await this.paymentClient.get({ id: paymentId });
      const status = mapMercadoPagoStatus(payment.status);
      return {
        success: status === 'approved',
        status,
        paymentId: payment.id,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        paymentMethod: 'mercadopago',
        additionalData: {
          statusDetail: payment.status_detail,
          paymentType: payment.payment_type_id,
          installments: payment.installments,
          externalReference: payment.external_reference,
        },
      };
    } catch (error) {
      console.error('Error al confirmar pago con MercadoPago:', error);
      throw new Error(`Error al confirmar el pago con MercadoPago: ${error.message}`);
    }
  }

  /**
   * Maneja el webhook de MercadoPago
   * @param {Object} request - Objeto de solicitud HTTP
   * @returns {Promise<Object>} - Respuesta al webhook
   */
  async handleWebhook(request) {
    const { type, data } = request.body;

    if (type !== 'payment') {
      return { received: true, message: 'Tipo de notificación no manejado' };
    }

    try {
      const paymentId = data.id;
      const payment = await this.paymentClient.get({ id: paymentId });
      const status = mapMercadoPagoStatus(payment.status);
      return {
        paymentId: payment.id,
        status,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        externalReference: payment.external_reference,
        metadata: {
          statusDetail: payment.status_detail,
          paymentType: payment.payment_type_id,
          installments: payment.installments,
        },
      };
    } catch (error) {
      console.error('Error al procesar webhook de MercadoPago:', error);
      throw new Error(`Error en el webhook de MercadoPago: ${error.message}`);
    }
  }

  /**
   * Obtiene el estado de un pago de MercadoPago
   * @param {string} paymentId - ID del pago
   * @returns {Promise<Object>} - Estado del pago
   */
  async getPaymentStatus(paymentId) {
    try {
      const payment = await this.paymentClient.get({ id: paymentId });
      const status = mapMercadoPagoStatus(payment.status);
      return {
        id: payment.id,
        status,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        paymentMethod: 'mercadopago',
        requiresApproval: status === 'pending',
        additionalData: {
          statusDetail: payment.status_detail,
          paymentType: payment.payment_type_id,
          installments: payment.installments,
          externalReference: payment.external_reference,
          dateCreated: payment.date_created,
          dateLastUpdated: payment.date_last_updated,
        },
      };
    } catch (error) {
      console.error('Error al obtener estado de pago de MercadoPago:', error);
      throw new Error(`Error al obtener el estado del pago: ${error.message}`);
    }
  }
}

module.exports = MercadoPagoStrategy;
