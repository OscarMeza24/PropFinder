import { ConcretePaymentGatewayFactory, PaymentProcessor } from '../patterns/FactoryPattern';
import { RepositoryFactory } from '../patterns/RepositoryPattern';
import { Logger } from '../patterns/SingletonPattern';
import { Payment } from '../types';

export class PaymentService {
  private paymentFactory = new ConcretePaymentGatewayFactory();
  private paymentRepository = RepositoryFactory.getPaymentRepository();
  private logger = Logger.getInstance();

  async processPayment(
    paymentData: {
      userId: string;
      agentId?: string;
      amount: number;
      currency: string;
      paymentType: 'subscription' | 'listing_fee' | 'premium_feature';
      paymentMethod: 'stripe' | 'paypal' | 'mercadopago';
      metadata?: any;
    }
  ): Promise<{ payment: Payment | null; error: string | null }> {
    try {
      // Create payment record
      const payment = await this.paymentRepository.create({
        user_id: paymentData.userId,
        agent_id: paymentData.agentId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_type: paymentData.paymentType,
        payment_method: paymentData.paymentMethod,
        status: 'pending',
        metadata: paymentData.metadata || {}
      });

      // Get payment processor based on method
      const processor = this.paymentFactory.createPaymentProcessor(paymentData.paymentMethod);
      
      // Process payment with external gateway
      const paymentResult = await processor.processPayment(
        paymentData.amount,
        paymentData.currency,
        {
          ...paymentData.metadata,
          internal_payment_id: payment.id
        }
      );

      // Update payment record with external payment ID
      const updatedPayment = await this.paymentRepository.update(payment.id, {
        payment_intent_id: paymentResult.id,
        status: paymentResult.status === 'succeeded' ? 'completed' : 'pending'
      });

      this.logger.log('info', `Payment processed: ${payment.id} via ${paymentData.paymentMethod}`);
      return { payment: updatedPayment, error: null };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.log('error', `Payment processing failed: ${errorMessage}`);
      return { payment: null, error: errorMessage };
    }
  }

  async verifyPayment(paymentId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);
      
      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      const processor = this.paymentFactory.createPaymentProcessor(payment.payment_method);
      const isValid = await processor.verifyPayment(payment.payment_intent_id || '');

      if (isValid && payment.status !== 'completed') {
        await this.paymentRepository.updateStatus(paymentId, 'completed');
      }

      this.logger.log('info', `Payment verified: ${paymentId}`);
      return { success: isValid, error: null };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.log('error', `Payment verification failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  async refundPayment(paymentId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);
      
      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (payment.status !== 'completed') {
        return { success: false, error: 'Can only refund completed payments' };
      }

      const processor = this.paymentFactory.createPaymentProcessor(payment.payment_method);
      const refundResult = await processor.refundPayment(payment.payment_intent_id || '');

      await this.paymentRepository.updateStatus(paymentId, 'refunded', {
        refund_id: refundResult.refund_id,
        refunded_at: new Date().toISOString()
      });

      this.logger.log('info', `Payment refunded: ${paymentId}`);
      return { success: true, error: null };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.log('error', `Payment refund failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      return await this.paymentRepository.findByUser(userId);
    } catch (err) {
      this.logger.log('error', `Failed to get user payments: ${err}`);
      return [];
    }
  }

  async getPendingPayments(): Promise<Payment[]> {
    try {
      return await this.paymentRepository.findByStatus('pending');
    } catch (err) {
      this.logger.log('error', `Failed to get pending payments: ${err}`);
      return [];
    }
  }

  // Webhook handler for payment status updates
  async handleWebhook(
    paymentMethod: 'stripe' | 'paypal' | 'mercadopago',
    webhookData: any
  ): Promise<void> {
    try {
      // Extract relevant information from webhook
      const { paymentIntentId, status, metadata } = this.parseWebhookData(paymentMethod, webhookData);
      
      // Find payment by external payment intent ID
      const payments = await this.paymentRepository.findAll();
      const payment = payments.find(p => p.payment_intent_id === paymentIntentId);
      
      if (payment) {
        await this.paymentRepository.updateStatus(payment.id, status, metadata);
        this.logger.log('info', `Payment status updated via webhook: ${payment.id} -> ${status}`);
      }

    } catch (err) {
      this.logger.log('error', `Webhook processing failed: ${err}`);
    }
  }

  private parseWebhookData(paymentMethod: string, webhookData: any): {
    paymentIntentId: string;
    status: string;
    metadata: any;
  } {
    // This would be customized based on each payment provider's webhook format
    switch (paymentMethod) {
      case 'stripe':
        return {
          paymentIntentId: webhookData.data?.object?.id || '',
          status: this.mapStripeStatus(webhookData.data?.object?.status),
          metadata: webhookData.data?.object?.metadata || {}
        };
      
      case 'paypal':
        return {
          paymentIntentId: webhookData.resource?.id || '',
          status: this.mapPayPalStatus(webhookData.resource?.state),
          metadata: webhookData.resource || {}
        };
      
      case 'mercadopago':
        return {
          paymentIntentId: webhookData.data?.id || '',
          status: this.mapMercadoPagoStatus(webhookData.action),
          metadata: webhookData.data || {}
        };
      
      default:
        return {
          paymentIntentId: '',
          status: 'pending',
          metadata: {}
        };
    }
  }

  private mapStripeStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      'succeeded': 'completed',
      'processing': 'pending',
      'requires_payment_method': 'failed',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'canceled': 'failed'
    };
    return statusMap[stripeStatus] || 'pending';
  }

  private mapPayPalStatus(paypalStatus: string): string {
    const statusMap: Record<string, string> = {
      'approved': 'completed',
      'created': 'pending',
      'failed': 'failed',
      'cancelled': 'failed'
    };
    return statusMap[paypalStatus] || 'pending';
  }

  private mapMercadoPagoStatus(mpAction: string): string {
    const statusMap: Record<string, string> = {
      'payment.created': 'pending',
      'payment.updated': 'completed',  // This would need more specific logic
      'payment.cancelled': 'failed'
    };
    return statusMap[mpAction] || 'pending';
  }
}