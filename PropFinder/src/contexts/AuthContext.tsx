import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { AuthContext } from './auth-context-utils';
import type { User } from '../services/api';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'agent'; // Made role optional
  phone?: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar token al cargar
    const checkAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const { user } = await apiService.getProfile();
          setUser(user);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        apiService.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Remove role from userData as it's not expected by the backend
      // Using void to explicitly ignore the role property
      const { role, ...userDataWithoutRole } = userData;
      void role; // Explicitly mark as intentionally unused
      const response = await apiService.register(userDataWithoutRole);
      setUser(response.user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrarse';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { name?: string; phone?: string }) => {
    try {
      const response = await apiService.updateProfile(data);
      setUser(response.user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar perfil';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    apiService.removeToken();
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;