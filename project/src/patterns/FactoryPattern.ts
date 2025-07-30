/**
 * Factory Method Pattern Implementation
 * Creates different types of objects based on input parameters
 */

import { User, Agent, Property, Payment } from '../types';

// Abstract Factory for User Types
abstract class UserFactory {
  abstract createUser(userData: any): User | Agent;
}

// Concrete Factory for Buyers
class BuyerFactory extends UserFactory {
  createUser(userData: any): User {
    return {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phone,
      role: 'buyer',
      avatar_url: userData.avatar_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// Concrete Factory for Agents
class AgentFactory extends UserFactory {
  createUser(userData: any): Agent {
    return {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phone,
      role: 'agent',
      avatar_url: userData.avatar_url,
      license_number: userData.license_number,
      agency: userData.agency,
      bio: userData.bio,
      specializations: userData.specializations || [],
      rating: userData.rating || 0,
      total_sales: userData.total_sales || 0,
      subscription_plan: userData.subscription_plan || 'basic',
      subscription_expires_at: userData.subscription_expires_at,
      is_verified: userData.is_verified || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// User Factory Manager
class UserFactoryManager {
  private static factories: Map<string, UserFactory> = new Map([
    ['buyer', new BuyerFactory()],
    ['seller', new BuyerFactory()],
    ['agent', new AgentFactory()]
  ]);

  public static createUser(role: string, userData: any): User | Agent {
    const factory = this.factories.get(role);
    if (!factory) {
      throw new Error(`No factory found for user role: ${role}`);
    }
    return factory.createUser(userData);
  }
}

// Payment Gateway Factory
abstract class PaymentGatewayFactory {
  abstract createPaymentProcessor(type: string): PaymentProcessor;
}

interface PaymentProcessor {
  processPayment(amount: number, currency: string, metadata?: any): Promise<any>;
  verifyPayment(paymentId: string): Promise<boolean>;
  refundPayment(paymentId: string): Promise<any>;
}

class StripeProcessor implements PaymentProcessor {
  async processPayment(amount: number, currency: string, metadata?: any): Promise<any> {
    // Stripe payment processing logic
    return {
      id: `stripe_${Date.now()}`,
      status: 'pending',
      amount,
      currency,
      gateway: 'stripe'
    };
  }

  async verifyPayment(paymentId: string): Promise<boolean> {
    // Stripe verification logic
    return true;
  }

  async refundPayment(paymentId: string): Promise<any> {
    // Stripe refund logic
    return { refund_id: `refund_${paymentId}` };
  }
}

class PayPalProcessor implements PaymentProcessor {
  async processPayment(amount: number, currency: string, metadata?: any): Promise<any> {
    // PayPal payment processing logic
    return {
      id: `paypal_${Date.now()}`,
      status: 'pending',
      amount,
      currency,
      gateway: 'paypal'
    };
  }

  async verifyPayment(paymentId: string): Promise<boolean> {
    // PayPal verification logic
    return true;
  }

  async refundPayment(paymentId: string): Promise<any> {
    // PayPal refund logic
    return { refund_id: `refund_${paymentId}` };
  }
}

class MercadoPagoProcessor implements PaymentProcessor {
  async processPayment(amount: number, currency: string, metadata?: any): Promise<any> {
    // MercadoPago payment processing logic
    return {
      id: `mp_${Date.now()}`,
      status: 'pending',
      amount,
      currency,
      gateway: 'mercadopago'
    };
  }

  async verifyPayment(paymentId: string): Promise<boolean> {
    // MercadoPago verification logic
    return true;
  }

  async refundPayment(paymentId: string): Promise<any> {
    // MercadoPago refund logic
    return { refund_id: `refund_${paymentId}` };
  }
}

class ConcretePaymentGatewayFactory extends PaymentGatewayFactory {
  private processors: Map<string, PaymentProcessor> = new Map([
    ['stripe', new StripeProcessor()],
    ['paypal', new PayPalProcessor()],
    ['mercadopago', new MercadoPagoProcessor()]
  ]);

  createPaymentProcessor(type: string): PaymentProcessor {
    const processor = this.processors.get(type);
    if (!processor) {
      throw new Error(`No payment processor found for type: ${type}`);
    }
    return processor;
  }
}

// Property Factory for different property types
class PropertyFactory {
  static createProperty(type: string, data: any): Property {
    const baseProperty: Omit<Property, 'property_type'> = {
      id: data.id || '',
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency || 'USD',
      listing_type: data.listing_type,
      area_sqm: data.area_sqm,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country || 'USA',
      postal_code: data.postal_code,
      latitude: data.latitude,
      longitude: data.longitude,
      features: data.features || [],
      images: data.images || [],
      agent_id: data.agent_id,
      owner_id: data.owner_id,
      status: data.status || 'active',
      views_count: data.views_count || 0,
      favorites_count: data.favorites_count || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    switch (type) {
      case 'house':
      case 'villa':
        return {
          ...baseProperty,
          property_type: type as 'house' | 'villa',
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms
        };
      case 'apartment':
      case 'condo':
        return {
          ...baseProperty,
          property_type: type as 'apartment' | 'condo',
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms
        };
      case 'commercial':
      case 'land':
        return {
          ...baseProperty,
          property_type: type as 'commercial' | 'land'
        };
      default:
        throw new Error(`Unknown property type: ${type}`);
    }
  }
}

export { 
  UserFactoryManager, 
  ConcretePaymentGatewayFactory, 
  PropertyFactory,
  type PaymentProcessor 
};

export { ConcretePaymentGatewayFactory }