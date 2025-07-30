/**
 * Strategy Pattern Implementation
 * Provides interchangeable algorithms for different business operations
 */

import { Property, PropertyFilter } from '../types';

// Search Strategy Interface
interface SearchStrategy {
  search(properties: Property[], query: string, filters?: PropertyFilter): Property[];
}

// Text-based Search Strategy
class TextSearchStrategy implements SearchStrategy {
  search(properties: Property[], query: string, filters?: PropertyFilter): Property[] {
    const searchTerms = query.toLowerCase().split(' ');
    
    return properties.filter(property => {
      const searchableText = [
        property.title,
        property.description,
        property.address,
        property.city,
        property.state,
        property.features.join(' ')
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  }
}

// Price-based Search Strategy
class PriceSearchStrategy implements SearchStrategy {
  search(properties: Property[], query: string, filters?: PropertyFilter): Property[] {
    const price = parseFloat(query.replace(/[^\d.]/g, ''));
    if (isNaN(price)) return properties;
    
    const tolerance = price * 0.1; // 10% tolerance
    
    return properties.filter(property => 
      Math.abs(property.price - price) <= tolerance
    );
  }
}

// Location-based Search Strategy
class LocationSearchStrategy implements SearchStrategy {
  search(properties: Property[], query: string, filters?: PropertyFilter): Property[] {
    return properties.filter(property => {
      const locationText = [
        property.address,
        property.city,
        property.state,
        property.postal_code
      ].join(' ').toLowerCase();
      
      return locationText.includes(query.toLowerCase());
    });
  }
}

// Feature-based Search Strategy
class FeatureSearchStrategy implements SearchStrategy {
  search(properties: Property[], query: string, filters?: PropertyFilter): Property[] {
    const searchTerms = query.toLowerCase().split(' ');
    
    return properties.filter(property => {
      const features = property.features.map(f => f.toLowerCase());
      return searchTerms.some(term => 
        features.some(feature => feature.includes(term))
      );
    });
  }
}

// Search Context
class PropertySearchContext {
  private strategy: SearchStrategy;

  constructor(strategy: SearchStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: SearchStrategy): void {
    this.strategy = strategy;
  }

  search(properties: Property[], query: string, filters?: PropertyFilter): Property[] {
    return this.strategy.search(properties, query, filters);
  }
}

// Pricing Strategy Interface
interface PricingStrategy {
  calculatePrice(basePrice: number, options: any): number;
}

// Standard Pricing Strategy
class StandardPricingStrategy implements PricingStrategy {
  calculatePrice(basePrice: number, options: any): number {
    return basePrice;
  }
}

// Premium Pricing Strategy (for premium listings)
class PremiumPricingStrategy implements PricingStrategy {
  calculatePrice(basePrice: number, options: any): number {
    const premiumMultiplier = 1.15; // 15% markup for premium features
    let finalPrice = basePrice * premiumMultiplier;
    
    if (options.featuredListing) {
      finalPrice += 50; // Additional fee for featured placement
    }
    
    if (options.virtualTour) {
      finalPrice += 25; // Additional fee for virtual tour
    }
    
    return finalPrice;
  }
}

// Subscription Pricing Strategy
class SubscriptionPricingStrategy implements PricingStrategy {
  calculatePrice(basePrice: number, options: any): number {
    const { plan, duration } = options;
    
    const planPrices = {
      basic: 29,
      premium: 79,
      enterprise: 149
    };
    
    const discounts = {
      1: 0,    // monthly - no discount
      6: 0.1,  // 6 months - 10% discount
      12: 0.2  // yearly - 20% discount
    };
    
    const planPrice = planPrices[plan as keyof typeof planPrices] || planPrices.basic;
    const discount = discounts[duration as keyof typeof discounts] || 0;
    
    return planPrice * duration * (1 - discount);
  }
}

// Commission Calculation Strategy
interface CommissionStrategy {
  calculateCommission(salePrice: number, agentLevel: string): number;
}

class StandardCommissionStrategy implements CommissionStrategy {
  calculateCommission(salePrice: number, agentLevel: string): number {
    const rates = {
      junior: 0.025,   // 2.5%
      senior: 0.03,    // 3%
      expert: 0.035    // 3.5%
    };
    
    const rate = rates[agentLevel as keyof typeof rates] || rates.junior;
    return salePrice * rate;
  }
}

class TieredCommissionStrategy implements CommissionStrategy {
  calculateCommission(salePrice: number, agentLevel: string): number {
    let commission = 0;
    
    // Tiered commission structure
    if (salePrice <= 100000) {
      commission = salePrice * 0.03; // 3% for first $100k
    } else if (salePrice <= 500000) {
      commission = 100000 * 0.03 + (salePrice - 100000) * 0.025; // 2.5% for next $400k
    } else {
      commission = 100000 * 0.03 + 400000 * 0.025 + (salePrice - 500000) * 0.02; // 2% for above $500k
    }
    
    // Agent level multiplier
    const multipliers = {
      junior: 0.8,
      senior: 1.0,
      expert: 1.2
    };
    
    const multiplier = multipliers[agentLevel as keyof typeof multipliers] || 1.0;
    return commission * multiplier;
  }
}

// Notification Strategy Interface
interface NotificationStrategy {
  send(recipient: string, message: string, data?: any): Promise<boolean>;
}

// Email Notification Strategy
class EmailNotificationStrategy implements NotificationStrategy {
  async send(recipient: string, message: string, data?: any): Promise<boolean> {
    try {
      // Email sending logic would go here
      console.log(`Sending email to ${recipient}: ${message}`);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }
}

// SMS Notification Strategy
class SMSNotificationStrategy implements NotificationStrategy {
  async send(recipient: string, message: string, data?: any): Promise<boolean> {
    try {
      // SMS sending logic would go here
      console.log(`Sending SMS to ${recipient}: ${message}`);
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }
}

// Push Notification Strategy
class PushNotificationStrategy implements NotificationStrategy {
  async send(recipient: string, message: string, data?: any): Promise<boolean> {
    try {
      // Push notification logic would go here
      console.log(`Sending push notification to ${recipient}: ${message}`);
      return true;
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }
}

// Multi-channel Notification Strategy
class MultiChannelNotificationStrategy implements NotificationStrategy {
  private strategies: NotificationStrategy[];

  constructor(strategies: NotificationStrategy[]) {
    this.strategies = strategies;
  }

  async send(recipient: string, message: string, data?: any): Promise<boolean> {
    const results = await Promise.all(
      this.strategies.map(strategy => strategy.send(recipient, message, data))
    );
    
    // Return true if at least one notification was sent successfully
    return results.some(result => result);
  }
}

// Notification Context
class NotificationContext {
  private strategy: NotificationStrategy;

  constructor(strategy: NotificationStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: NotificationStrategy): void {
    this.strategy = strategy;
  }

  async notify(recipient: string, message: string, data?: any): Promise<boolean> {
    return this.strategy.send(recipient, message, data);
  }
}

// Strategy Factory
class StrategyFactory {
  // Search Strategies
  static createSearchStrategy(type: 'text' | 'price' | 'location' | 'feature'): SearchStrategy {
    switch (type) {
      case 'text':
        return new TextSearchStrategy();
      case 'price':
        return new PriceSearchStrategy();
      case 'location':
        return new LocationSearchStrategy();
      case 'feature':
        return new FeatureSearchStrategy();
      default:
        return new TextSearchStrategy();
    }
  }

  // Pricing Strategies
  static createPricingStrategy(type: 'standard' | 'premium' | 'subscription'): PricingStrategy {
    switch (type) {
      case 'standard':
        return new StandardPricingStrategy();
      case 'premium':
        return new PremiumPricingStrategy();
      case 'subscription':
        return new SubscriptionPricingStrategy();
      default:
        return new StandardPricingStrategy();
    }
  }

  // Commission Strategies
  static createCommissionStrategy(type: 'standard' | 'tiered'): CommissionStrategy {
    switch (type) {
      case 'standard':
        return new StandardCommissionStrategy();
      case 'tiered':
        return new TieredCommissionStrategy();
      default:
        return new StandardCommissionStrategy();
    }
  }

  // Notification Strategies
  static createNotificationStrategy(type: 'email' | 'sms' | 'push' | 'multi'): NotificationStrategy {
    switch (type) {
      case 'email':
        return new EmailNotificationStrategy();
      case 'sms':
        return new SMSNotificationStrategy();
      case 'push':
        return new PushNotificationStrategy();
      case 'multi':
        return new MultiChannelNotificationStrategy([
          new EmailNotificationStrategy(),
          new PushNotificationStrategy()
        ]);
      default:
        return new EmailNotificationStrategy();
    }
  }
}

export {
  PropertySearchContext,
  StrategyFactory,
  type SearchStrategy,
  type PricingStrategy,
  type CommissionStrategy,
  type NotificationStrategy
};