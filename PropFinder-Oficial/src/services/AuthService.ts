import { supabase } from '../config/supabase';
import { User } from '../types';
import { RepositoryFactory } from '../patterns/RepositoryPattern';
import { Logger } from '../patterns/SingletonPattern';

export class AuthService {
  private userRepository = RepositoryFactory.getUserRepository();
  private logger = Logger.getInstance();

  async signUp(email: string, password: string, userData: {
    full_name: string;
    phone?: string;
    role: 'buyer' | 'seller' | 'agent';
  }): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        this.logger.log('error', `Sign up failed: ${error.message}`);
        return { user: null, error: error.message };
      }

      if (data.user) {
        // Create user profile in our users table
        const userProfile = await this.userRepository.create({
          id: data.user.id,
          email,
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role,
          email_verified: false
        });

        this.logger.log('info', `User signed up successfully: ${email}`);
        return { user: userProfile, error: null };
      }

      return { user: null, error: 'User creation failed' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.log('error', `Sign up error: ${errorMessage}`);
      return { user: null, error: errorMessage };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.logger.log('error', `Sign in failed: ${error.message}`);
        return { user: null, error: error.message };
      }

      if (data.user) {
        // Get user profile from our users table
        const userProfile = await this.userRepository.findById(data.user.id);
        
        if (userProfile) {
          this.logger.log('info', `User signed in successfully: ${email}`);
          return { user: userProfile, error: null };
        }
      }

      return { user: null, error: 'User profile not found' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.log('error', `Sign in error: ${errorMessage}`);
      return { user: null, error: errorMessage };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        this.logger.log('error', `Sign out failed: ${error.message}`);
        return { error: error.message };
      }

      this.logger.log('info', 'User signed out successfully');
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.log('error', `Sign out error: ${errorMessage}`);
      return { error: errorMessage };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const userProfile = await this.userRepository.findById(user.id);
        return userProfile;
      }
      
      return null;
    } catch (err) {
      this.logger.log('error', `Get current user error: ${err}`);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<{ user: User | null; error: string | null }> {
    try {
      const updatedUser = await this.userRepository.update(userId, updates);
      this.logger.log('info', `User profile updated: ${userId}`);
      return { user: updatedUser, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.log('error', `Profile update error: ${errorMessage}`);
      return { user: null, error: errorMessage };
    }
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        this.logger.log('error', `Password reset failed: ${error.message}`);
        return { error: error.message };
      }

      this.logger.log('info', `Password reset email sent to: ${email}`);
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.log('error', `Password reset error: ${errorMessage}`);
      return { error: errorMessage };
    }
  }

  async changePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        this.logger.log('error', `Password change failed: ${error.message}`);
        return { error: error.message };
      }

      this.logger.log('info', 'Password changed successfully');
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.log('error', `Password change error: ${errorMessage}`);
      return { error: errorMessage };
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userProfile = await this.userRepository.findById(session.user.id);
        callback(userProfile);
      } else {
        callback(null);
      }
    });
  }
}