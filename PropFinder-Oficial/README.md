# PropFinder - Real Estate Portal

A comprehensive real estate platform built with modern web technologies, implementing advanced architectural patterns and design principles.

## 🏗️ Architecture Overview

PropFinder follows a **Monolithic Modular Architecture** with clean separation of concerns and implements multiple design patterns:

### Design Patterns Implemented

1. **Singleton Pattern** - For configuration management, database connections, and logging
2. **Factory Method Pattern** - For creating different user types, payment processors, and property objects
3. **Repository Pattern** - Clean data access layer with database abstraction
4. **Strategy Pattern** - Flexible search algorithms, pricing strategies, and notification methods

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI/UX**: Tailwind CSS + Framer Motion + Lucide React Icons
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with JWT
- **Payments**: Stripe + PayPal + MercadoPago
- **Maps**: Leaflet + OpenStreetMap
- **Real-time**: Supabase Realtime (WebSockets)

## 🚀 Features

### Core Functionality
- ✅ Property listings with advanced search and filtering
- ✅ Geospatial property search with map integration
- ✅ User authentication and role-based access control
- ✅ Real-time chat between buyers and agents
- ✅ Visit scheduling system
- ✅ Multiple payment gateway integration
- ✅ Agent subscription management
- ✅ Property analytics and reporting
- ✅ Notification system (email, SMS, push)
- ✅ Responsive design for all devices

### Payment Integration
- **Stripe**: Credit/debit cards, digital wallets
- **PayPal**: PayPal account payments
- **MercadoPago**: Latin American payment methods

### Database Schema
- Users, Agents, Properties, Visits, Payments
- Chat rooms and messages
- Notifications and analytics
- Row Level Security (RLS) enabled
- Geospatial indexing for location-based queries

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Payment gateway accounts (test mode)

### 1. Clone and Install
```bash
git clone <repository-url>
cd propfinder
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Configure your `.env` file with:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payment Gateways (Test Mode)
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_MERCADOPAGO_PUBLIC_KEY=your_mercadopago_public_key

# Maps
VITE_MAPBOX_API_KEY=your_mapbox_api_key
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL migration file:
   ```sql
   -- Execute src/config/database.sql in your Supabase SQL editor
   ```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 🗃️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Layout/          # Header, Footer, Layout
│   └── Properties/      # Property-related components
├── pages/               # Page components
│   ├── auth/           # Authentication pages
│   └── ...
├── patterns/           # Design pattern implementations
│   ├── SingletonPattern.ts
│   ├── FactoryPattern.ts
│   ├── RepositoryPattern.ts
│   └── StrategyPattern.ts
├── services/           # Business logic services
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── config/            # Configuration files
```

## 🎯 Design Patterns in Detail

### 1. Singleton Pattern
- **ConfigManager**: Centralized application configuration
- **DatabaseConnection**: Single database connection instance
- **Logger**: Unified logging system

### 2. Factory Method Pattern
- **UserFactory**: Creates different user types (buyer, seller, agent)
- **PaymentGatewayFactory**: Creates payment processors
- **PropertyFactory**: Creates different property types

### 3. Repository Pattern
- **UserRepository**, **PropertyRepository**, etc.
- Clean separation between data access and business logic
- Database-agnostic interface

### 4. Strategy Pattern
- **SearchStrategy**: Different search algorithms (text, location, price)
- **PricingStrategy**: Various pricing models
- **NotificationStrategy**: Multiple notification channels

## 💳 Payment Integration

### Stripe
```typescript
// Example usage
const stripeProcessor = paymentFactory.createPaymentProcessor('stripe');
await stripeProcessor.processPayment(amount, currency, metadata);
```

### PayPal
```typescript
// Example usage
const paypalProcessor = paymentFactory.createPaymentProcessor('paypal');
await paypalProcessor.processPayment(amount, currency, metadata);
```

### MercadoPago
```typescript
// Example usage
const mpProcessor = paymentFactory.createPaymentProcessor('mercadopago');
await mpProcessor.processPayment(amount, currency, metadata);
```

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- **JWT-based authentication** with secure token handling
- **Input validation** on both client and server side
- **XSS protection** with content sanitization
- **CSRF protection** with secure headers

## 📱 Responsive Design

- **Mobile-first approach** with progressive enhancement
- **Breakpoints**: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)
- **Touch-friendly interactions** on mobile devices
- **Optimized images** with lazy loading

## 🧪 Testing Strategy

- **Unit tests** for business logic and utilities
- **Integration tests** for API endpoints
- **Component tests** for React components
- **End-to-end tests** for critical user flows

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Cloud Deployment
The application is ready for deployment on:
- **Vercel** (Recommended for frontend)
- **Netlify**
- **AWS S3 + CloudFront**
- **Google Cloud Storage**

## 📊 Analytics & Monitoring

- **Property view tracking**
- **User behavior analytics**
- **Payment transaction monitoring**
- **Performance metrics**
- **Error tracking and logging**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@propfinder.com
- 📚 Documentation: [PropFinder Docs](https://docs.propfinder.com)
- 🐛 Issues: [GitHub Issues](https://github.com/propfinder/issues)

## 🏆 Credits

Built with ❤️ by the PropFinder team using modern web technologies and best practices in software architecture.