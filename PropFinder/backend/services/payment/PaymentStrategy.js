class PaymentStrategy {
  /**
   * Crea una instancia de la estrategia de pago
   * @param {Object} config - Configuración específica del proveedor de pago
   */
  constructor(config = {}) {
    if (this.constructor === PaymentStrategy) {
      throw new Error('PaymentStrategy es una clase abstracta y no puede ser instanciada directamente.');
    }
    this.config = config;
  }

  /**
   * Crea un pago o intención de pago
   * @param {Object} paymentData - Datos del pago
   * @param {number} paymentData.amount - Monto del pago
   * @param {string} paymentData.currency - Moneda del pago
   * @param {string} paymentData.description - Descripción del pago
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} - Resultado de la creación del pago
   */
  // eslint-disable-next-line class-methods-use-this
  createPayment(_paymentData, _metadata = {}) {
    throw new Error('El método createPayment debe ser implementado por las clases hijas');
  }

  /**
   * Confirma o ejecuta un pago
   * @param {string} paymentId - ID del pago a confirmar
   * @param {Object} [additionalData] - Datos adicionales necesarios para confirmar el pago
   * @returns {Promise<Object>} - Resultado de la confirmación del pago
   */
  // eslint-disable-next-line class-methods-use-this
  confirmPayment(_paymentId, _additionalData = {}) {
    throw new Error('El método confirmPayment debe ser implementado por las clases hijas');
  }

  /**
   * Maneja la notificación webhook del proveedor de pago
   * @param {Object} request - Objeto de solicitud HTTP
   * @returns {Promise<Object>} - Respuesta al webhook
   */
  // eslint-disable-next-line class-methods-use-this
  handleWebhook(_request) {
    throw new Error('El método handleWebhook debe ser implementado por las clases hijas');
  }

  /**
   * Obtiene el estado actual de un pago
   * @param {string} paymentId - ID del pago
   * @returns {Promise<Object>} - Estado del pago
   */
  // eslint-disable-next-line class-methods-use-this
  getPaymentStatus(_paymentId) {
    throw new Error('El método getPaymentStatus debe ser implementado por las clases hijas');
  }
}

module.exports = PaymentStrategy;
