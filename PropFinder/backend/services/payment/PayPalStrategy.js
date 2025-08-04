const paypal = require('paypal-rest-sdk');
const PaymentStrategy = require('./PaymentStrategy.js');

const mapPayPalStatus = (paypalState) => {
  const statusMap = {
    created: 'pending',
    approved: 'completed',
    completed: 'completed',
    partially_refunded: 'refunded',
    refunded: 'refunded',
    voided: 'cancelled',
    expired: 'expired',
    in_progress: 'pending',
    pending: 'pending',
    failed: 'failed',
  };
  return statusMap[paypalState.toLowerCase()] || 'unknown';
};

class PayPalStrategy extends PaymentStrategy {
  constructor(config) {
    super(config);
    // Configurar PayPal SDK
    paypal.configure({
      mode: config.mode || 'sandbox',
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });
  }

  /**
   * Crea un pago de PayPal
   * @param {Object} paymentData - Datos del pago
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} - Resultado de la creación del pago
   */
  // eslint-disable-next-line class-methods-use-this
  async createPayment(paymentData, metadata = {}) {
    const {
      amount,
      currency = 'USD',
      description,
      returnUrl,
      cancelUrl,
    } = paymentData;
    const createPayment = {
      intent: 'sale',
      payer: { payment_method: 'paypal' },
      redirect_urls: {
        return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
      },
      transactions: [{
        item_list: {
          items: [{
            name: description || 'Pago de PropFinder',
            sku: metadata.propertyId || 'item',
            price: parseFloat(amount).toFixed(2),
            currency,
            quantity: 1,
          }],
        },
        amount: {
          currency,
          total: parseFloat(amount).toFixed(2),
        },
        description: description || 'Pago de PropFinder',
      }],
    };

    try {
      const payment = await new Promise((resolve, reject) => {
        paypal.payment.create(createPayment, (error, createdPayment) => {
          if (error) {
            return reject(error);
          }
          return resolve(createdPayment);
        });
      });

      const approvalUrl = payment.links.find((link) => link.rel === 'approval_url');
      return {
        id: payment.id,
        status: 'pending',
        paymentMethod: 'paypal',
        approvalUrl: approvalUrl ? approvalUrl.href : null,
        requiresApproval: true,
        additionalData: {
          paymentId: payment.id,
        },
      };
    } catch (error) {
      console.error('Error al crear pago con PayPal:', error);
      throw new Error(`Error al procesar el pago con PayPal: ${error.message}`);
    }
  }

  /**
   * Ejecuta un pago de PayPal después de la aprobación del usuario
   * @param {string} paymentId - ID del pago a ejecutar
   * @param {Object} additionalData - Datos adicionales (p.ej., payerId)
   * @returns {Promise<Object>} - Resultado de la ejecución del pago
   */
  // eslint-disable-next-line class-methods-use-this
  async confirmPayment(paymentId, additionalData = {}) {
    const { payerId } = additionalData;
    if (!payerId) {
      throw new Error('Se requiere payerId para ejecutar el pago de PayPal');
    }

    try {
      const executePayment = await new Promise((resolve, reject) => {
        paypal.payment.execute(paymentId, { payer_id: payerId }, (error, executedPayment) => {
          if (error) {
            return reject(error);
          }
          return resolve(executedPayment);
        });
      });

      const status = mapPayPalStatus(executePayment.state);

      return {
        success: status === 'completed',
        status,
        paymentId: executePayment.id,
        amount: parseFloat(executePayment.transactions[0].amount.total),
        currency: executePayment.transactions[0].amount.currency,
        paymentMethod: 'paypal',
        additionalData: {
          payerId: executePayment.payer.payer_info.payer_id,
          paymentMethod: executePayment.payer.payment_method,
        },
      };
    } catch (error) {
      console.error('Error al ejecutar pago con PayPal:', error);
      throw new Error(`Error al ejecutar el pago con PayPal: ${error.message}`);
    }
  }

  /**
   * Maneja el webhook de PayPal (si es necesario)
   * @param {Object} request - Objeto de solicitud HTTP
   * @returns {Promise<Object>} - Respuesta al webhook
   */
  // eslint-disable-next-line class-methods-use-this
  async handleWebhook(_request) {
    // PayPal normalmente no requiere un manejador de webhook para pagos simples
    // ya que usa redirecciones para confirmar el pago
    // Pero se puede implementar si es necesario para IPN (Instant Payment Notification)
    return { received: true, message: 'Webhook recibido, pero no se requiere acción adicional' };
  }

  /**
   * Obtiene el estado de un pago de PayPal
   * @param {string} paymentId - ID del pago
   * @returns {Promise<Object>} - Estado del pago
   */
  // eslint-disable-next-line class-methods-use-this
  async getPaymentStatus(paymentId) {
    try {
      const payment = await new Promise((resolve, reject) => {
        paypal.payment.get(paymentId, (error, foundPayment) => {
          if (error) {
            return reject(error);
          }
          return resolve(foundPayment);
        });
      });

      const status = mapPayPalStatus(payment.state);
      return {
        id: payment.id,
        status,
        amount: parseFloat(payment.transactions[0].amount.total),
        currency: payment.transactions[0].amount.currency,
        paymentMethod: 'paypal',
        requiresApproval: status === 'pending',
        additionalData: {
          state: payment.state,
          createTime: payment.create_time,
          updateTime: payment.update_time || payment.create_time,
        },
      };
    } catch (error) {
      console.error('Error al obtener estado de pago de PayPal:', error);
      throw new Error(`Error al obtener el estado del pago: ${error.message}`);
    }
  }
}

module.exports = PayPalStrategy;
