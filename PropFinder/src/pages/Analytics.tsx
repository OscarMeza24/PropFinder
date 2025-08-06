import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye, MessageSquare, Calendar, Star, TrendingUp } from 'lucide-react';

// Mock data for the new dashboard
const kpiData = [
  {
    title: 'Vistas de Propiedades',
    value: '12,450',
    icon: Eye,
    change: '+11.5%',
    changeType: 'increase',
  },
  {
    title: 'Mensajes Recibidos',
    value: '320',
    icon: MessageSquare,
    change: '+2.8%',
    changeType: 'increase',
  },
  {
    title: 'Visitas Agendadas',
    value: '85',
    icon: Calendar,
    change: '-1.2%',
    changeType: 'decrease',
  },
  {
    title: 'Veces en Favoritos',
    value: '1,200',
    icon: Star,
    change: '+25%',
    changeType: 'increase',
  },
];

const weeklyActivityData = [
  { name: 'Lun', vistas: 400, mensajes: 24 },
  { name: 'Mar', vistas: 300, mensajes: 13 },
  { name: 'Mié', vistas: 600, mensajes: 48 },
  { name: 'Jue', vistas: 480, mensajes: 39 },
  { name: 'Vie', vistas: 700, mensajes: 48 },
  { name: 'Sáb', vistas: 890, mensajes: 50 },
  { name: 'Dom', vistas: 950, mensajes: 55 },
];

const popularPropertiesData = [
    { id: 1, name: 'Villa Moderna en la Costa', views: 2300, favorites: 450 },
    { id: 2, name: 'Apartamento Céntrico con Vistas', views: 1800, favorites: 320 },
    { id: 3, name: 'Casa de Campo con Piscina', views: 1500, favorites: 280 },
    { id: 4, name: 'Penthouse de Lujo Urbano', views: 1200, favorites: 210 },
];

const Analytics: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Analíticas</h1>
          <p className="text-gray-600 mt-1">Un resumen de la actividad de tus propiedades.</p>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">{kpi.title}</h3>
                <kpi.icon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
              <div className={`text-sm mt-2 flex items-center ${kpi.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>{kpi.change} vs. el mes pasado</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Activity Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Actividad Semanal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                <YAxis yAxisId="left" tick={{ fill: '#6B7280' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(5px)',
                    borderRadius: '0.5rem',
                    border: '1px solid #E5E7EB',
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="vistas" stroke="#3B82F6" strokeWidth={2} name="Vistas" />
                <Line yAxisId="right" type="monotone" dataKey="mensajes" stroke="#10B981" strokeWidth={2} name="Mensajes" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Popular Properties Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Propiedades Más Populares</h3>
            <ul className="space-y-4">
              {popularPropertiesData.map((prop) => (
                <li key={prop.id} className="flex items-center justify-between">
                  <span className="text-gray-700 truncate w-40">{prop.name}</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="h-4 w-4 mr-1 text-blue-500" />
                      {prop.views}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      {prop.favorites}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;