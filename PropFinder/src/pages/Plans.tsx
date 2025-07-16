import React from 'react';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Plans: React.FC = () => {
  const { user } = useAuth();

  const plans = [
    {
      name: 'Básico',
      price: 0,
      period: 'Gratis',
      icon: Star,
      color: 'bg-gray-500',
      features: [
        'Hasta 3 propiedades publicadas',
        'Búsqueda básica',
        'Chat con agentes',
        'Soporte por email',
        'Perfil básico'
      ],
      limitations: [
        'Sin destacar propiedades',
        'Analytics limitados',
        'Sin prioridad en búsquedas'
      ],
      buttonText: 'Plan Actual',
      buttonStyle: 'bg-gray-300 text-gray-700 cursor-not-allowed'
    },
    {
      name: 'Profesional',
      price: 29,
      period: 'mes',
      icon: Crown,
      color: 'bg-blue-500',
      popular: true,
      features: [
        'Hasta 25 propiedades publicadas',
        'Propiedades destacadas',
        'Analytics avanzados',
        'Prioridad en búsquedas',
        'Chat ilimitado',
        'Soporte prioritario',
        'Herramientas de marketing',
        'Reportes mensuales'
      ],
      limitations: [],
      buttonText: 'Actualizar Ahora',
      buttonStyle: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      name: 'Empresarial',
      price: 99,
      period: 'mes',
      icon: Zap,
      color: 'bg-purple-500',
      features: [
        'Propiedades ilimitadas',
        'Todas las funciones destacadas',
        'API personalizada',
        'Integración CRM',
        'Soporte telefónico 24/7',
        'Manager de cuenta dedicado',
        'Branding personalizado',
        'Analytics en tiempo real',
        'Exportación de datos'
      ],
      limitations: [],
      buttonText: 'Contactar Ventas',
      buttonStyle: 'bg-purple-600 text-white hover:bg-purple-700'
    }
  ];

  const handlePlanSelection = (planName: string, price: number) => {
    if (price === 0) return;
    
    // Aquí se implementaría la integración con Stripe/PayPal
    console.log(`Seleccionado plan: ${planName} - $${price}`);
    
    // Simular redirección a pasarela de pago
    alert(`Redirigiendo a la pasarela de pago para el plan ${planName}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planes de Suscripción
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Elige el plan perfecto para tu negocio inmobiliario. Todos los planes incluyen acceso completo a la plataforma.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-semibold">
                  Más Popular
                </div>
              )}
              
              <div className={`p-6 ${plan.popular ? 'pt-12' : ''}`}>
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-full ${plan.color}`}>
                    <plan.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  {plan.name}
                </h3>
                
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelection(plan.name, plan.price)}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${plan.buttonStyle}`}
                  disabled={plan.price === 0}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Comparación de Características
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Característica</th>
                  <th className="text-center py-3 px-4">Básico</th>
                  <th className="text-center py-3 px-4">Profesional</th>
                  <th className="text-center py-3 px-4">Empresarial</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">Propiedades publicadas</td>
                  <td className="text-center py-3 px-4">3</td>
                  <td className="text-center py-3 px-4">25</td>
                  <td className="text-center py-3 px-4">Ilimitadas</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">Propiedades destacadas</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">Analytics avanzados</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">Soporte prioritario</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">API personalizada</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">Manager de cuenta</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Métodos de Pago Aceptados
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-blue-600 mb-2">
                <svg className="h-12 w-12 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.015l-.817 5.043a.598.598 0 0 1-.589.496l-.533.064zm2.18-12.65c2.508 0 4.25-1.222 4.25-2.915 0-1.694-1.742-2.915-4.25-2.915H5.947L7.076 8.687h2.18z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">PayPal</h3>
              <p className="text-sm text-gray-600">Pago seguro con PayPal</p>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-purple-600 mb-2">
                <svg className="h-12 w-12 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Stripe</h3>
              <p className="text-sm text-gray-600">Tarjetas de crédito y débito</p>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-green-600 mb-2">
                <svg className="h-12 w-12 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Pago Seguro</h3>
              <p className="text-sm text-gray-600">Transacciones encriptadas</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Preguntas Frecuentes
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Puedo cambiar de plan en cualquier momento?
              </h3>
              <p className="text-gray-600">
                Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican inmediatamente y se prorratea el costo.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Hay período de prueba gratis?
              </h3>
              <p className="text-gray-600">
                Todos los planes pagos incluyen 14 días de prueba gratis. No se requiere tarjeta de crédito para comenzar.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Qué sucede si cancelo mi suscripción?
              </h3>
              <p className="text-gray-600">
                Puedes cancelar en cualquier momento. Tu cuenta se mantendrá activa hasta el final del período de facturación actual.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Ofrecen descuentos por pago anual?
              </h3>
              <p className="text-gray-600">
                Sí, ofrecemos 20% de descuento en todos los planes pagos cuando eliges facturación anual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;