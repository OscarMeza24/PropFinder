import React from 'react';
import { Link } from 'react-router-dom';
import { Home, MessageCircle, Calendar, TrendingUp, Users, Star, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
import { useChat } from '../contexts/ChatContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { properties, featuredProperties } = useProperty();
  const { chatRooms } = useChat();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Requerido
            </h2>
            <p className="text-gray-600 mb-8">
              Necesitas iniciar sesión para acceder al dashboard
            </p>
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userProperties = properties.filter(p => p.agent.id === user.id);
  const unreadMessages = chatRooms.reduce((sum, room) => sum + room.unreadCount, 0);

  const stats = [
    {
      name: 'Propiedades Publicadas',
      value: userProperties.length,
      icon: Home,
      color: 'bg-blue-500'
    },
    {
      name: 'Mensajes Pendientes',
      value: unreadMessages,
      icon: MessageCircle,
      color: 'bg-green-500'
    },
    {
      name: 'Visitas Agendadas',
      value: 8,
      icon: Calendar,
      color: 'bg-yellow-500'
    },
    {
      name: 'Propiedades Destacadas',
      value: featuredProperties.filter(p => p.agent.id === user.id).length,
      icon: Star,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido, {user.name}
          </h1>
          <p className="text-gray-600">
            {user.role === 'agent' ? 'Panel de Agente Inmobiliario' : 'Panel de Usuario'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Properties */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {user.role === 'agent' ? 'Mis Propiedades' : 'Propiedades Favoritas'}
                </h2>
                {user.role === 'agent' && (
                  <Link
                    to="/properties/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nueva Propiedad</span>
                  </Link>
                )}
              </div>

              <div className="space-y-4">
                {(user.role === 'agent' ? userProperties : featuredProperties).slice(0, 5).map((property) => (
                  <div key={property.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{property.title}</h3>
                      <p className="text-sm text-gray-600">{property.location.city}</p>
                      <p className="text-sm font-medium text-blue-600">
                        ${property.price.toLocaleString()}
                      </p>
                    </div>
                    {user.role === 'agent' && (
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center">
                <Link
                  to="/properties"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Ver todas las propiedades
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Messages */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Link
                  to="/chat"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Ir al Chat</span>
                </Link>
                <Link
                  to="/analytics"
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>Ver Analytics</span>
                </Link>
                <Link
                  to="/plans"
                  className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Star className="h-5 w-5" />
                  <span>Planes Premium</span>
                </Link>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Mensajes Recientes</h3>
              <div className="space-y-3">
                {chatRooms.slice(0, 3).map((room) => (
                  <div key={room.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{room.name}</p>
                      {room.lastMessage && (
                        <p className="text-xs text-gray-600 truncate">
                          {room.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {room.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link
                  to="/chat"
                  className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                >
                  Ver todos los mensajes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;