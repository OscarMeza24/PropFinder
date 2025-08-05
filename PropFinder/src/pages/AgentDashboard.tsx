import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Home, 
  Users, 
  TrendingUp, 
  Calendar,
  MessageCircle,
  DollarSign,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/auth-context-utils';
import { useProperty } from '../contexts/PropertyContext';

interface AgentStats {
  totalProperties: number;
  activeProperties: number;
  totalViews: number;
  totalContacts: number;
  totalEarnings: number;
  pendingVisits: number;
}

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { properties } = useProperty();
  const [stats, setStats] = useState<AgentStats>({
    totalProperties: 0,
    activeProperties: 0,
    totalViews: 0,
    totalContacts: 0,
    totalEarnings: 0,
    pendingVisits: 0,
  });

  // Filtrar propiedades del agente actual
  const agentProperties = properties.filter(
    property => property.agent?.id === user?.id?.toString()
  );

  useEffect(() => {
    // Calcular estadísticas del agente
    const activeProps = agentProperties.filter(p => p.status === 'active');
    
    setStats({
      totalProperties: agentProperties.length,
      activeProperties: activeProps.length,
      totalViews: agentProperties.reduce((sum, p) => sum + (p.views || 0), 0),
      totalContacts: agentProperties.reduce((sum, p) => sum + (p.contacts || 0), 0),
      totalEarnings: agentProperties.reduce((sum, p) => sum + (p.price * 0.03), 0), // 3% comisión
      pendingVisits: agentProperties.reduce((sum, p) => sum + (p.pendingVisits || 0), 0),
    });
  }, [agentProperties]);

  if (user?.role !== 'agent') {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
            <p className="text-gray-600 mt-2">Solo los agentes pueden acceder a esta página.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard del Agente</h1>
          <p className="text-gray-600 mt-2">
            Bienvenido de vuelta !!!! {user?.name}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <Link
              to="/properties/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Propiedad
            </Link>
            <Link
              to="/agent/visits"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Gestionar Visitas
            </Link>
            <Link
              to="/agent/contacts"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Mensajes
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProperties}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Propiedades Activas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeProperties}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vistas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalViews}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contactos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalContacts}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comisiones Estimadas</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${stats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visitas Pendientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingVisits}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Calendar className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Mis Propiedades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propiedad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vistas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentProperties.length > 0 ? (
                  agentProperties.map((property) => (
                    <tr key={property.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={property.images?.[0] || '/placeholder-house.jpg'}
                            alt={property.title}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {property.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {property.location?.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${property.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            property.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : property.status === 'sold'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {property.status === 'active' ? 'Activa' : 
                           property.status === 'sold' ? 'Vendida' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.views || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/properties/${property.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/properties/${property.id}/edit`}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No tienes propiedades aún
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Comienza agregando tu primera propiedad
                        </p>
                        <Link
                          to="/properties/new"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Propiedad
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
