import React, { useState } from 'react';
import { Star, Send, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context-utils';

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  targetId: string;
  targetName: string;
  rating: number;
  comment: string;
  date: string;
  propertyId?: string;
  propertyTitle?: string;
}

interface ReviewFormProps {
  userType: 'client' | 'agent';
  onReviewSubmitted: (review: Review) => void;
}

interface ReviewListProps {
  reviews: Review[];
  userType: 'client' | 'agent';
}

interface ReviewSystemProps {
  userType: 'client' | 'agent';
}

// Componente del formulario de reseña
const ReviewForm: React.FC<ReviewFormProps> = ({ userType, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;

    setIsSubmitting(true);

    try {
      // Simular envío al backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newReview: Review = {
        id: `review_${Date.now()}_${Math.random()}`,
        reviewerId: user?.id?.toString() || '',
        reviewerName: user?.name || '',
        targetId: userType === 'client' ? 'agent-1' : 'client-1',
        targetName: userType === 'client' ? 'Agente Ejemplo' : 'Cliente Ejemplo',
        rating: rating,
        comment: comment,
        date: new Date().toISOString(),
        propertyId: 'prop-1',
        propertyTitle: 'Casa en el centro'
      };
      
      onReviewSubmitted(newReview);
      
      // Resetear formulario
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error enviando reseña:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {userType === 'client' ? 'Evaluar Agente' : 'Evaluar Cliente'}
      </h3>
      
      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Calificación
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                } hover:text-yellow-400 transition-colors`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {rating === 1 && 'Muy malo'}
            {rating === 2 && 'Malo'}
            {rating === 3 && 'Regular'}
            {rating === 4 && 'Bueno'}
            {rating === 5 && 'Excelente'}
          </p>
        )}
      </div>

      {/* Comentario */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comentario
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder={`Describe tu experiencia con ${userType === 'client' ? 'el agente' : 'el cliente'}...`}
          required
        />
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={rating === 0 || !comment.trim() || isSubmitting}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="h-4 w-4 mr-2" />
        {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
      </button>
    </form>
  );
};

// Componente de la lista de reseñas
const ReviewList: React.FC<ReviewListProps> = ({ reviews, userType }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Reseñas {userType === 'client' ? 'de Agentes' : 'de Clientes'} ({reviews.length})
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Promedio:</span>
            <div className="flex items-center space-x-1">
              <span className="text-lg font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
            </div>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No hay reseñas aún
          </h4>
          <p className="text-gray-600">
            {userType === 'client' 
              ? 'Las reseñas de agentes aparecerán aquí una vez que interactúes con ellos.'
              : 'Las reseñas de clientes aparecerán aquí cuando te evalúen.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.reviewerName}</h4>
                    <p className="text-sm text-gray-600">
                      {userType === 'client' ? 'Evaluó a' : 'Evaluó como cliente a'} {review.targetName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {renderStars(review.rating)}
                  <p className="text-sm text-gray-500 mt-1">{formatDate(review.date)}</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{review.comment}</p>
              
              {review.propertyId && review.propertyTitle && (
                <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
                  Sobre: {review.propertyTitle}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente principal del sistema de reseñas
const ReviewSystem: React.FC<ReviewSystemProps> = ({ userType }) => {
  const [reviews, setReviews] = useState<Review[]>([
    // Datos de ejemplo
    ...(userType === 'client' ? [
      {
        id: '1',
        reviewerId: 'user-1',
        reviewerName: 'Juan Pérez',
        targetId: 'agent-1',
        targetName: 'María González',
        rating: 5,
        comment: 'Excelente agente, muy profesional y atenta. Me ayudó a encontrar la casa perfecta.',
        date: '2024-01-15T10:00:00Z',
        propertyId: 'prop-1',
        propertyTitle: 'Apartamento en Zona Norte'
      },
      {
        id: '2',
        reviewerId: 'user-2',
        reviewerName: 'Ana López',
        targetId: 'agent-2',
        targetName: 'Carlos Mendoza',
        rating: 4,
        comment: 'Buen servicio, aunque tardó un poco en responder a veces.',
        date: '2024-01-10T14:30:00Z',
        propertyId: 'prop-2',
        propertyTitle: 'Casa en el Centro'
      }
    ] : [
      {
        id: '3',
        reviewerId: 'agent-1',
        reviewerName: 'María González',
        targetId: 'client-1',
        targetName: 'Pedro Ramírez',
        rating: 5,
        comment: 'Cliente muy serio y puntual. Proceso de venta muy fluido.',
        date: '2024-01-12T09:00:00Z',
        propertyId: 'prop-3',
        propertyTitle: 'Oficina Comercial'
      },
      {
        id: '4',
        reviewerId: 'agent-2',
        reviewerName: 'Carlos Mendoza',
        targetId: 'client-2',
        targetName: 'Lucía Morales',
        rating: 3,
        comment: 'Cliente indecisa, cambió de opinión varias veces durante el proceso.',
        date: '2024-01-08T16:45:00Z',
        propertyId: 'prop-4',
        propertyTitle: 'Departamento Moderno'
      }
    ])
  ]);

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews(prev => [newReview, ...prev]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <MessageCircle className="h-6 w-6 text-blue-600 mr-3" />
        <h2 className="text-xl font-bold text-gray-900">
          Sistema de Reseñas
        </h2>
      </div>
      
      <ReviewForm userType={userType} onReviewSubmitted={handleReviewSubmitted} />
      <ReviewList reviews={reviews} userType={userType} />
    </div>
  );
};

export default ReviewSystem;
