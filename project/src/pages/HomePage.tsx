import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { PropertyCard } from '../components/Properties/PropertyCard';
import { RepositoryFactory } from '../patterns/RepositoryPattern';
import { Property } from '../types';
import { 
  Search, 
  TrendingUp, 
  Users, 
  MapPin, 
  Star,
  ArrowRight,
  Shield,
  Clock,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

export function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const propertyRepository = RepositoryFactory.getPropertyRepository();

  useEffect(() => {
    loadFeaturedProperties();
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      const properties = await propertyRepository.getFeatured();
      setFeaturedProperties(properties.slice(0, 6));
    } catch (error) {
      console.error('Failed to load featured properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stats = [
    { label: 'Properties Listed', value: '50,000+', icon: TrendingUp },
    { label: 'Happy Customers', value: '25,000+', icon: Users },
    { label: 'Cities Covered', value: '100+', icon: MapPin },
    { label: 'Expert Agents', value: '1,500+', icon: Star }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Properties',
      description: 'All properties are verified by our expert team for authenticity and quality.'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Get assistance anytime with our round-the-clock customer support team.'
    },
    {
      icon: Award,
      title: 'Expert Agents',
      description: 'Work with certified real estate professionals with years of experience.'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Find Your Dream
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                Property Today
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Discover amazing properties, connect with expert agents, and make your real estate dreams come true.
            </p>

            {/* Search Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={handleSearch} className="relative">
                <div className="flex rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter location, property type, or keywords..."
                      className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-white/70 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap justify-center gap-4 text-sm"
            >
              <span className="text-blue-200">Popular searches:</span>
              {['Apartments in NYC', 'Houses for Sale', 'Luxury Properties', 'Commercial Space'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    navigate(`/properties?search=${encodeURIComponent(term)}`);
                  }}
                  className="text-white hover:text-emerald-300 underline underline-offset-2 transition-colors"
                >
                  {term}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Properties
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our hand-picked selection of premium properties from trusted agents.
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/properties"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span>View All Properties</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose PropFinder?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide the best real estate experience with our comprehensive platform and expert services.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="text-center p-8 rounded-xl hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Find Your Perfect Property?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join thousands of satisfied customers who found their dream properties through PropFinder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/properties"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Browse Properties</span>
              </Link>
              <Link
                to="/auth/signup"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 inline-flex items-center justify-center space-x-2"
              >
                <Users className="w-5 h-5" />
                <span>Join as Agent</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}