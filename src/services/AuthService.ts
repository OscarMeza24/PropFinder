import { supabase } from '../config/supabase';
import { User } from '../types';
import { RepositoryFactory } from '../patterns/RepositoryPattern';
import { Logger } from '../patterns/SingletonPattern';
import { createClient } from '@supabase/supabase-js';

interface UserData {
  full_name: string;
  phone?: string;
  role?: string;
}

// Crear un cliente de administrador
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Asegúrate de tener esta variable en tu .env
);

export class AuthService {
  private userRepository = RepositoryFactory.getUserRepository();
  private logger = Logger.getInstance();

  async signUp(email: string, password: string, userData: UserData) {
    try {
      console.log('Iniciando registro con:', { email, userData });
      
      // 1. Crear el usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            phone: userData.phone || ''
          }
        }
      });

      console.log('Respuesta de Supabase:', { 
        authData, 
        authError,
        session: await supabase.auth.getSession()
      });

      if (authError) {
        console.error('Error en autenticación de Supabase:', authError);
        throw new Error(authError.message || 'Error al registrar el usuario');
      }

      // 2. Si el usuario se creó correctamente, crear el perfil en la tabla users
      if (authData?.user) {
        try {
          // Usar el cliente de administrador para evitar problemas de RLS
          const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
              id: authData.user.id,
              email: email,
              full_name: userData.full_name,
              phone: userData.phone || null,
              role: userData.role || 'buyer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (profileError) {
            console.error('Error al crear el perfil en la base de datos:', profileError);
            throw new Error('Error al crear el perfil del usuario en la base de datos');
          }

          console.log('Perfil de usuario creado exitosamente:', userProfile);
          return { user: userProfile, error: null };
        } catch (profileError) {
          console.error('Error al crear el perfil del usuario:', profileError);
          // Opcional: Eliminar el usuario de auth si falla la creación del perfil
          // await supabase.auth.admin.deleteUser(authData.user.id);
          throw new Error('Error al crear el perfil del usuario');
        }
      }

      throw new Error('No se pudo crear el usuario: Datos de usuario no disponibles');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error en signUp:', {
        message: errorMessage,
        error: err,
        stack: err instanceof Error ? err.stack : undefined
      });
      return { user: null, error: errorMessage };
    }
  }
  
  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      // 1. Primero autenticamos con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Error en autenticación:", error);
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No se pudo autenticar el usuario' };
      }

      // 2. Obtenemos el perfil del usuario usando el cliente de administrador
      // para evitar problemas de RLS
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error al obtener el perfil:', profileError);
        // Si hay error pero el usuario está autenticado, devolvemos un usuario básico
        return { 
          user: { 
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name || '',
            role: 'buyer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, 
          error: null 
        };
      }

      if (userProfile) {
        this.logger.log('info', `Usuario autenticado: ${email}`);
        return { user: userProfile as User, error: null };
      }

      // 3. Si no existe el perfil, lo creamos
      const newUserProfile = {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: 'buyer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert(newUserProfile);

      if (insertError) {
        console.error('Error al crear el perfil:', insertError);
        // Aún así devolvemos el usuario aunque falle la creación del perfil
        return { 
          user: newUserProfile as User, 
          error: 'Inicio de sesión exitoso, pero hubo un error al cargar el perfil completo' 
        };
      }

      return { user: newUserProfile as User, error: null };
    } catch (error) {
      console.error('Error en signIn:', { error });
      return { 
        user: null, 
        error: 'Error al iniciar sesión. Por favor, inténtalo de nuevo.'
      };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.log("Error al cerrar sesión: ", error);
        this.logger.log('error', `Sign out failed: ${error.message}`);
        return { error: error.message };
      }

      this.logger.log('info', 'User signed out successfully');
      return { error: null };
    } catch (err) {
      this.logger.log('error', `Sign out error: ${err}`);
      return { error: 'Error al cerrar sesión. Por favor, inténtalo de nuevo.' };
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
      this.logger.log('error', `Profile update error: ${err}`);
      return { user: null, error: 'Error al actualizar el perfil. Por favor, inténtalo de nuevo.' };
    }
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        console.log("Error al restablecer contraséña: ", error);
        this.logger.log('error', `Password reset failed: ${error.message}`);
        return { error: error.message };
      }

      this.logger.log('info', `Password reset email sent to: ${email}`);
      return { error: null };
    } catch (err) {
      this.logger.log('error', `Password reset error: ${err}`);
      return { error: 'Error al restablecer la contraséña. Por favor, inténtalo de nuevo.' };
    }
  }

  async changePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.log("Error al cambiar contraséña: ", error);
        this.logger.log('error', `Password change failed: ${error.message}`);
        return { error: error.message };
      }

      console.log("Contraséña cambiada exitosamente");
      this.logger.log('info', 'Password changed successfully');
      return { error: null };
    } catch (err) {
      this.logger.log('error', `Password change error: ${err}`);
      return { error: 'Error al cambiar la contraséña. Por favor, inténtalo de nuevo.' };
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed: ", event);
      if (session?.user) {
        const userProfile = await this.userRepository.findById(session.user.id);
        callback(userProfile);
      } else {
        callback(null);
      }
    });
  }
}