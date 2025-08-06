import React from 'react';
import { Star, TrendingUp, Users, MessageSquare } from 'lucide-react';

interface ReviewStatsProps {
  userType: 'client' | 'agent';
  reviews?: {
    total: number;
    average: number;
    breakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  className?: string;
}

const ReviewStats: React.FC<ReviewStatsProps> = ({ 
  userType, 
  reviews = {
    total: 0,
    average: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  },
  className = ''
}) => {
  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : '0.0';
  };

  const getStarPercentage = (rating: number) => {
    const total = Object.values(reviews.breakdown).reduce((sum, count) => sum + count, 0);
    return total > 0 ? (reviews.breakdown[rating as keyof typeof reviews.breakdown] / total) * 100 : 0;
  };

  const getRatingColor = (average: number) => {
    if (average >= 4.5) return 'text-green-600';
    if (average >= 3.5) return 'text-yellow-600';
    if (average >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRecommendationText = (userType: string, average: number) => {
    if (userType === 'agent') {
      if (average >= 4.5) return 'Excelente reputación como agente';
      if (average >= 3.5) return 'Buena reputación como agente';
      if (average >= 2.5) return 'Reputación promedio como agente';
      return 'Necesita mejorar su servicio';
    } else {
      if (average >= 4.5) return 'Cliente muy confiable';
      if (average >= 3.5) return 'Cliente confiable';
      if (average >= 2.5) return 'Cliente promedio';
      return 'Historial de cliente limitado';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {userType === 'agent' ? 'Mi Reputación' : 'Mi Historial'}
        </h3>
        <div className="flex items-center space-x-1">
          <Star className="h-5 w-5 text-yellow-400 fill-current" />
          <span className={`text-lg font-bold ${getRatingColor(reviews.average)}`}>
            {formatRating(reviews.average)}
          </span>
        </div>
      </div>

      {/* Resumen de calificación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Star className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatRating(reviews.average)}
          </div>
          <div className="text-sm text-gray-600">Calificación Promedio</div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{reviews.total}</div>
          <div className="text-sm text-gray-600">Total de Reseñas</div>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {reviews.total > 0 ? Math.round(getStarPercentage(5) + getStarPercentage(4)) : 0}%
          </div>
          <div className="text-sm text-gray-600">Reseñas Positivas</div>
        </div>
      </div>

      {/* Desglose de calificaciones */}
      {reviews.total > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Desglose de Calificaciones</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-12">
                  <span className="text-sm text-gray-600">{rating}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getStarPercentage(rating)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {reviews.breakdown[rating as keyof typeof reviews.breakdown]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendación */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Users className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Estado:</span>
        </div>
        <p className="text-gray-600">
          {getRecommendationText(userType, reviews.average)}
        </p>
        {reviews.total === 0 && (
          <p className="text-sm text-blue-600 mt-2">
            {userType === 'agent' 
              ? 'Comienza a ayudar a clientes para recibir tus primeras reseñas.'
              : 'Interactúa con agentes para comenzar a construir tu historial.'}
          </p>
        )}
      </div>

      {/* Métricas adicionales para agentes */}
      {userType === 'agent' && reviews.total > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Métricas de Rendimiento</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {Math.round((getStarPercentage(5) + getStarPercentage(4)) / 100 * reviews.total)}
              </div>
              <div className="text-xs text-gray-600">Clientes Satisfechos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {reviews.average >= 4.0 ? '✓' : '⚠️'}
              </div>
              <div className="text-xs text-gray-600">
                {reviews.average >= 4.0 ? 'Recomendado' : 'Mejorar'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewStats;
