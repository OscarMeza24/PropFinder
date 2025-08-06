import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const initialTestimonials = [
  {
    name: 'Ana García',
    role: 'Compradora de vivienda',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 5,
    quote: '¡PropFinder hizo que encontrar la casa de mis sueños fuera increíblemente fácil! La búsqueda avanzada y el chat directo con los agentes me ahorraron semanas de trabajo. ¡Totalmente recomendado!',
  },
  {
    name: 'Carlos Rodríguez',
    role: 'Agente Inmobiliario',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    rating: 5,
    quote: 'Como agente, la plataforma me ha dado una visibilidad increíble. Las herramientas de analytics son de primer nivel y me ayudan a entender mejor el mercado. Mis ventas han aumentado un 30%.',
  },
  {
    name: 'Laura Martínez',
    role: 'Inversionista',
    avatar: 'https://randomuser.me/api/portraits/women/47.jpg',
    rating: 4,
    quote: 'La cantidad de datos y propiedades disponibles es impresionante. Pude analizar y comparar varias opciones de inversión rápidamente. Una herramienta esencial para cualquier inversionista serio.',
  },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

import { useEffect } from 'react';

const Testimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const storedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    if (storedReviews.length > 0) {
      setTestimonials([...initialTestimonials, ...storedReviews]);
    }
  }, []);

  const handleNext = () => {
    setIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Lo que dicen nuestros clientes</h2>
          <p className="text-xl text-gray-600">La opinión de nuestros usuarios es nuestra mayor recompensa.</p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <div className="flex flex-col items-center text-center">
                <img
                  src={testimonials[index].avatar}
                  alt={testimonials[index].name}
                  className="w-24 h-24 rounded-full mb-4 border-4 border-blue-200"
                />
                <p className="text-gray-600 italic text-lg mb-4">"{testimonials[index].quote}"</p>
                <div className="font-bold text-gray-900">{testimonials[index].name}</div>
                <div className="text-sm text-gray-500 mb-4">{testimonials[index].role}</div>
                <StarRating rating={testimonials[index].rating} />
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={handlePrev}
            className="absolute top-1/2 -left-4 md:-left-16 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </button>
          <button
            onClick={handleNext}
            className="absolute top-1/2 -right-4 md:-right-16 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"
          >
            <ChevronRight className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
