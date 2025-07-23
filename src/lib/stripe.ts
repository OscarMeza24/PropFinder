import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

export const stripePromise = loadStripe(stripePublishableKey);

export const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Básico',
    price: 0,
    priceId: null,
    features: [
      'Hasta 3 propiedades',
      'Búsqueda básica',
      'Chat con agentes',
      'Soporte por email'
    ]
  },
  professional: {
    name: 'Profesional',
    price: 29,
    priceId: 'price_professional_monthly',
    features: [
      'Hasta 25 propiedades',
      'Propiedades destacadas',
      'Analytics avanzados',
      'Prioridad en búsquedas',
      'Chat ilimitado',
      'Soporte prioritario'
    ]
  },
  enterprise: {
    name: 'Empresarial',
    price: 99,
    priceId: 'price_enterprise_monthly',
    features: [
      'Propiedades ilimitadas',
      'API personalizada',
      'Integración CRM',
      'Soporte 24/7',
      'Manager dedicado',
      'Branding personalizado'
    ]
  }
};