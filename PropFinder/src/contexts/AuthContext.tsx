import React, { useEffect, useState } from "react";
import type { User } from "../services/api";
import apiService from "../services/api";
import { AuthContext } from "./auth-context-utils";

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'user' | 'agent';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar token al cargar
    const checkAuth = async () => {
      try {
        console.log('🔍 AuthContext - Checking auth...');
        console.log('🔍 AuthContext - Is authenticated?', apiService.isAuthenticated());
        
        if (apiService.isAuthenticated()) {
          const { user } = await apiService.getProfile();
          console.log('🔍 AuthContext - checkAuth user:', user);
          console.log('🔍 AuthContext - checkAuth user role:', user?.role);
          setUser(user);
        } else {
          console.log('🔍 AuthContext - No token found, user not authenticated');
        }
      } catch (error) {
        console.error("Error checking auth:", error);
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
      console.log('🔍 AuthContext - Login response:', response);
      console.log('🔍 AuthContext - User from response:', response.user);
      console.log('🔍 AuthContext - User role:', response.user?.role);
      setUser(response.user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al iniciar sesión";
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
      // Use only the required fields for registration
      const registrationData = {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        ...(userData.phone && { phone: userData.phone }),
      };

      const response = await apiService.register(registrationData);
      setUser(response.user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al registrarse";
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
      const errorMessage =
        error instanceof Error ? error.message : "Error al actualizar perfil";
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
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
