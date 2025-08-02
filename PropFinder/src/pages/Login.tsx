import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/auth-context-utils';
import apiService from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationNeeded(false);
    setResendSuccess(false);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.log(error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      if (errorMessage.includes('verifica tu correo electrónico')) {
        setVerificationNeeded(true);
      } else {
        setError('Credenciales inválidas. Intenta nuevamente.');
      }
    }
  };
  
  const handleResendVerification = async () => {
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico');
      return;
    }
    
    setResendingEmail(true);
    setError('');
    setResendSuccess(false);
    
    try {
      await apiService.resendVerificationEmail(email);
      setResendSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al reenviar el correo de verificación';
      setError(errorMessage);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleDemoLogin = async (userType: 'user' | 'agent') => {
    setError('');
    
    try {
      // Use the test users from the database schema
      const demoEmail = userType === 'agent' ? 'agent@example.com' : 'user1@propfinder.com';
      // The password for test users is 'password' (hashed in the database)
      await login(demoEmail, 'password');
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login error:', error);
      setError('Error al iniciar sesión de demostración. Por favor, verifica que el servidor esté en ejecución.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-gray-600">
              Accede a tu cuenta de PropFinder
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {verificationNeeded && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
              <p className="mb-2">Por favor, verifica tu correo electrónico para activar tu cuenta.</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail || resendSuccess}
                className="text-blue-600 hover:text-blue-800 underline focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendingEmail ? 'Enviando...' : resendSuccess ? 'Correo enviado' : 'Reenviar correo de verificación'}
              </button>
            </div>
          )}
          
          {resendSuccess && !verificationNeeded && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              Correo de verificación enviado exitosamente. Por favor, revisa tu bandeja de entrada.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Recordarme</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O prueba con</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleDemoLogin('user')}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Demo Usuario
              </button>
              <button
                onClick={() => handleDemoLogin('agent')}
                className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Demo Agente
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;