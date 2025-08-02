import React, { useState } from 'react';
import { Eye, MessageCircle, DollarSign, MapPin, Calendar, Download } from 'lucide-react';
import { useAuth } from '../contexts/auth-context-utils';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data for analytics
  const metrics = [
    {
      name: 'Visualizaciones Totales',
      value: '12,845',
      change: '+12.5%',
      icon: Eye,
      color: 'text-blue-600'
    },
    {
      name: 'Propiedades Activas',
      value: '23',
      change: '+2',
      icon: MapPin,
      color: 'text-green-600'
    },
    {
      name: 'Consultas Recibidas',
      value: '148',
      change: '+8.2%',
      icon: MessageCircle,
      color: 'text-purple-600'
    },
    {
      name: 'Ingresos Generados',
      value: '$45,230',
      change: '+15.3%',
      icon: DollarSign,
      color: 'text-yellow-600'
    }
  ];

  const chartData = [
    { month: 'Ene', visualizaciones: 4000, consultas: 45, ingresos: 8500 },
    { month: 'Feb', visualizaciones: 3800, consultas: 52, ingresos: 9200 },
    { month: 'Mar', visualizaciones: 5200, consultas: 38, ingresos: 7800 },
    { month: 'Abr', visualizaciones: 4600, consultas: 65, ingresos: 12000 },
    { month: 'May', visualizaciones: 6100, consultas: 48, ingresos: 9800 },
    { month: 'Jun', visualizaciones: 5800, consultas: 72, ingresos: 14500 }
  ];

  const topProperties = [
    { name: 'Luxury Downtown Apartment', views: 2540, inquiries: 18, revenue: '$8,500' },
    { name: 'Modern Family House', views: 1890, inquiries: 12, revenue: '$6,200' },
    { name: 'Cozy Studio Apartment', views: 1650, inquiries: 15, revenue: '$4,800' },
    { name: 'Suburban Villa', views: 1420, inquiries: 8, revenue: '$3,900' },
    { name: 'City Center Condo', views: 1280, inquiries: 11, revenue: '$5,100' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Requerido
            </h2>
            <p className="text-gray-600 mb-8">
              Necesitas iniciar sesión para acceder a los analytics
            </p>
            <a
              href="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Monitorea el rendimiento de tus propiedades</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="1y">Último año</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gray-100 ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
                <span className="text-sm text-green-600 font-medium">{metric.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-sm text-gray-600">{metric.name}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tendencias Mensuales</h2>
            <div className="h-80 flex items-end justify-between space-x-2">
              {chartData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t-lg relative" style={{ height: '200px' }}>
                    <div
                      className="bg-blue-500 rounded-t-lg absolute bottom-0 w-full transition-all duration-300"
                      style={{ height: `${(data.visualizaciones / 6500) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">{data.month}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Visualizaciones</span>
                </div>
              </div>
            </div>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Distribución Geográfica</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New York</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-sm font-medium">4,520</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Los Angeles</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-sm font-medium">3,610</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">San Francisco</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-sm font-medium">2,715</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Miami</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-sm font-medium">1,810</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Chicago</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-sm font-medium">1,190</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Properties */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Propiedades con Mejor Rendimiento</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Propiedad</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Vistas</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Consultas</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Ingresos</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Conversión</th>
                </tr>
              </thead>
              <tbody>
                {topProperties.map((property, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{property.name}</div>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600">{property.views}</td>
                    <td className="text-center py-3 px-4 text-gray-600">{property.inquiries}</td>
                    <td className="text-center py-3 px-4 text-gray-600">{property.revenue}</td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-600 font-medium">
                        {((property.inquiries / property.views) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Actividad Reciente</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Eye className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Nueva visualización en "Luxury Downtown Apartment"</p>
                <p className="text-xs text-gray-500">Hace 2 minutos</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Nueva consulta para "Modern Family House"</p>
                <p className="text-xs text-gray-500">Hace 15 minutos</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Visita agendada para "Cozy Studio Apartment"</p>
                <p className="text-xs text-gray-500">Hace 1 hora</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;