import React, { useState } from 'react';
import { Star, MessageCircle } from 'lucide-react';

interface QuickReviewButtonProps {
  targetId: string;
  targetName: string;
  targetType: 'client' | 'agent';
  propertyId?: string;
  propertyTitle?: string;
  buttonText?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  onReviewSubmitted?: () => void;
}

const QuickReviewButton: React.FC<QuickReviewButtonProps> = ({
  targetId,
  targetName,
  targetType,
  propertyId,
  propertyTitle,
  buttonText = 'Escribir Reseña',
  buttonSize = 'md',
  variant = 'primary',
  onReviewSubmitted
}) => {
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buttonSizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const buttonVariantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;

    setIsSubmitting(true);

    try {
      // Simular envío al backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aquí iría la llamada real a la API
      const reviewData = {
        targetId,
        targetName,
        targetType,
        rating,
        comment: comment.trim(),
        propertyId,
        propertyTitle
      };
      
      console.log('Enviando reseña:', reviewData);
      
      // Resetear formulario
      setRating(0);
      setComment('');
      setShowModal(false);
      
      // Callback opcional
      onReviewSubmitted?.();
      
    } catch (error) {
      console.error('Error enviando reseña:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botón */}
      <button
        onClick={() => setShowModal(true)}
        className={`w-full inline-flex items-center justify-center rounded-md transition-colors ${buttonSizeClasses[buttonSize]} ${buttonVariantClasses[variant]}`}
      >
        <Star className="h-4 w-4 mr-1.5" />
        {buttonText}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
            />

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Escribir Reseña
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Comparte tu experiencia con <strong>{targetName}</strong>
                      </p>
                      {propertyTitle && (
                        <p className="text-sm text-blue-600 mt-1">
                          Sobre: {propertyTitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6">
                  {/* Rating */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calificación
                    </label>
                    <div className="flex justify-center space-x-1">
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
                      <p className="text-center text-sm text-gray-600 mt-1">
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
                      placeholder={`Describe tu experiencia con ${targetName}...`}
                      required
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={rating === 0 || !comment.trim() || isSubmitting}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 inline-flex justify-center px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickReviewButton;
