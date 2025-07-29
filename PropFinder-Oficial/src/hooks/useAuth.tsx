import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { AuthService } from '../services/AuthService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = new AuthService();

  useEffect(() => {
    // Get initial auth state
    authService.getCurrentUser().then(user => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(user => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { user: signedInUser, error } = await authService.signIn(email, password);
    if (signedInUser) {
      setUser(signedInUser);
    }
    setLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    setLoading(true);
    const { user: newUser, error } = await authService.signUp(email, password, userData);
    if (newUser) {
      setUser(newUser);
    }
    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    await authService.signOut();
    setUser(null);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: 'No user logged in' };
    
    const { user: updatedUser, error } = await authService.updateProfile(user.id, updates);
    if (updatedUser) {
      setUser(updatedUser);
    }
    return { error };
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}