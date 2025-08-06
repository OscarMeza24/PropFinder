import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, TrendingUp, Users, Star, ArrowRight } from 'lucide-react';
import { Property } from '../contexts/property-context-utils';
import FeaturedPropertiesCarousel from '../components/home/FeaturedPropertiesCarousel';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  // const { featuredProperties } = useProperty(); // Se han comentado para usar datos de prueba

  const featuredProperties: Property[] = [
    {
      id: '1',
      title: 'Lujoso Apartamento en el Centro',
      price: 500000,
      type: 'apartment',
      bedrooms: 3,
      bathrooms: 2,
      area: 150,
      location: {
        address: 'Calle Falsa 123',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
      },
      images: ['https://i.imgur.com/Nn13T2Q.jpeg', 'https://i.imgur.com/gJ6SPt8.jpeg'],
      description: 'Un hermoso apartamento con vistas increíbles.',
      amenities: ['Piscina', 'Gimnasio', 'Seguridad 24h'],
      agent: {
        id: 'agent1',
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        phone: '555-1234',
      },
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Casa Familiar con Jardín',
      price: 750000,
      type: 'house',
      bedrooms: 4,
      bathrooms: 3,
      area: 250,
      location: {
        address: 'Avenida Siempreviva 742',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
      },
      images: ['https://i.imgur.com/S2Yh0bu.jpeg', 'https://i.imgur.com/K2yY1p6.jpeg'],
      description: 'Espaciosa casa ideal para una familia grande.',
      amenities: ['Jardín', 'Garaje', 'Patio'],
      agent: {
        id: 'agent2',
        name: 'Maria Rodriguez',
        email: 'maria.rodriguez@example.com',
        phone: '555-5678',
      },
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Moderno Condo Urbano',
      price: 450000,
      type: 'condo',
      bedrooms: 2,
      bathrooms: 2,
      area: 120,
      location: {
        address: 'Boulevard del Ocaso 45',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
      },
      images: ['https://i.imgur.com/K2yY1p6.jpeg', 'https://i.imgur.com/Nn13T2Q.jpeg'],
      description: 'Condominio con acabados de lujo y excelente ubicación.',
      amenities: ['Rooftop', 'Conserje', 'Gimnasio'],
      agent: {
        id: 'agent1',
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        phone: '555-1234',
      },
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
     {
      id: '4',
      title: 'Acogedora Casa de Campo',
      price: 620000,
      type: 'house',
      bedrooms: 3,
      bathrooms: 2,
      area: 200,
      location: {
        address: 'Camino del Roble 88',
        city: 'Shelbyville',
        state: 'IL',
        zipCode: '62565',
      },
      images: ['https://i.imgur.com/gJ6SPt8.jpeg', 'https://i.imgur.com/S2Yh0bu.jpeg'],
      description: 'Perfecta para escapar de la ciudad y disfrutar de la naturaleza.',
      amenities: ['Chimenea', 'Amplio jardín', 'Vistas al bosque'],
      agent: {
        id: 'agent3',
        name: 'Carlos Gomez',
        email: 'carlos.gomez@example.com',
        phone: '555-8765',
      },
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search logic here
    console.log('Searching for:', searchQuery, 'in', searchLocation);
  };

  const stats = [
    { icon: TrendingUp, label: 'Propiedades Activas', value: '12,000+' },
    { icon: Users, label: 'Usuarios Registrados', value: '50,000+' },
    { icon: Star, label: 'Agentes Verificados', value: '1,200+' },
    { icon: MapPin, label: 'Ciudades Cubiertas', value: '150+' }
  ];

  const features = [
    {
      title: 'Búsqueda Avanzada',
      description: 'Encuentra propiedades con filtros específicos y búsqueda geoespacial',
      icon: Search
    },
    {
      title: 'Agendamiento Fácil',
      description: 'Programa visitas a propiedades directamente con los agentes',
      icon: MapPin
    },
    {
      title: 'Chat en Tiempo Real',
      description: 'Comunícate instantáneamente con agentes inmobiliarios',
      icon: Users
    },
    {
      title: 'Analytics Completos',
      description: 'Obtén insights detallados sobre el mercado inmobiliario',
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Encuentra tu Hogar <span className="text-blue-200">Perfecto</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              La plataforma inmobiliaria más completa con búsqueda inteligente y agentes verificados
            </p>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="¿Qué estás buscando?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ubicación"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Search className="h-5 w-5" />
                  <span>Buscar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Propiedades Destacadas
            </h2>
            <p className="text-xl text-gray-600">
              Descubre las mejores propiedades seleccionadas por nuestros expertos
            </p>
          </div>
          
          <FeaturedPropertiesCarousel properties={featuredProperties} />
          
          <div className="text-center mt-12">
            <Link
              to="/properties"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>Ver todas las propiedades</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir PropFinder?
            </h2>
            <p className="text-xl text-gray-600">
              Herramientas avanzadas para una experiencia inmobiliaria única
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para encontrar tu próximo hogar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a miles de usuarios que ya confían en PropFinder
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Crear Cuenta
            </Link>
            <Link
              to="/properties"
              className="bg-transparent text-white border-2 border-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold"
            >
              Explorar Propiedades
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;