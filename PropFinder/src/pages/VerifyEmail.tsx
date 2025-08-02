import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import apiService from '../services/api';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de verificación no proporcionado');
        return;
      }

      try {
        const response = await apiService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Correo electrónico verificado con éxito');
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Error al verificar el correo electrónico'
        );
      }
    };

    verifyEmail();
  }, [token]);

  const handleRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Verificando tu correo electrónico
              </h2>
              <p className="text-gray-600">Por favor espera un momento...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                ¡Verificación exitosa!
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={handleRedirect}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Iniciar sesión
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Error de verificación
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={handleRedirect}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;