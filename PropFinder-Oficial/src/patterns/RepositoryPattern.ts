/**
 * Repository Pattern Implementation
 * Provides a clean abstraction layer for data access
 */

import { supabase, db } from '../config/supabase';
import { User, Agent, Property, PropertyFilter, Visit, ChatRoom, ChatMessage, Payment, Notification } from '../types';

// Generic Repository Interface
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(limit?: number, offset?: number): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// Base Repository Implementation
abstract class BaseRepository<T> implements Repository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await db.from(this.tableName).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<T[]> {
    const { data, error } = await db.from(this.tableName)
      .select('*')
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data || [];
  }

  async create(data: Partial<T>): Promise<T> {
    const { data: result, error } = await db.from(this.tableName)
      .insert(data as any)
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await db.from(this.tableName)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await db.from(this.tableName).delete().eq('id', id);
    return !error;
  }
}

// User Repository
class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await db.from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();
    if (error) return null;
    return data;
  }

  async findByRole(role: string): Promise<User[]> {
    const { data, error } = await db.from(this.tableName)
      .select('*')
      .eq('role', role);
    if (error) throw error;
    return data || [];
  }

  async verifyEmail(id: string): Promise<boolean> {
    const { error } = await db.from(this.tableName)
      .update({ email_verified: true })
      .eq('id', id);
    return !error;
  }
}

// Agent Repository
class AgentRepository extends BaseRepository<Agent> {
  constructor() {
    super('agents');
  }

  async findWithUserData(id: string): Promise<Agent | null> {
    const { data, error } = await db.from('agents')
      .select(`
        *,
        users (
          email,
          full_name,
          phone,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) return null;
    
    // Flatten the user data
    const { users, ...agentData } = data;
    return { ...users, ...agentData, role: 'agent' } as Agent;
  }

  async findBySpecialization(specialization: string): Promise<Agent[]> {
    const { data, error } = await db.from('agents')
      .select(`
        *,
        users (
          email,
          full_name,
          phone,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .contains('specializations', [specialization]);
    
    if (error) throw error;
    return data?.map(item => ({ ...item.users, ...item, role: 'agent' })) || [];
  }

  async updateRating(id: string, rating: number): Promise<boolean> {
    const { error } = await db.from(this.tableName)
      .update({ rating })
      .eq('id', id);
    return !error;
  }
}

// Property Repository
class PropertyRepository extends BaseRepository<Property> {
  constructor() {
    super('properties');
  }

  async findWithAgent(id: string): Promise<Property | null> {
    const { data, error } = await db.from('properties')
      .select(`
        *,
        property_images (*),
        agents (
          *,
          users (
            full_name,
            phone,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) return null;
    
    // Flatten agent data
    if (data.agents && data.agents.users) {
      data.agent = { ...data.agents.users, ...data.agents, role: 'agent' };
      delete data.agents;
    }
    
    return data;
  }

  async findByFilter(filter: PropertyFilter, limit = 20, offset = 0): Promise<Property[]> {
    let query = db.from('properties')
      .select(`
        *,
        property_images!inner(*),
        agents (
          *,
          users (
            full_name,
            phone,
            avatar_url
          )
        )
      `)
      .eq('status', 'active');

    // Apply filters
    if (filter.property_type?.length) {
      query = query.in('property_type', filter.property_type);
    }
    
    if (filter.listing_type) {
      query = query.eq('listing_type', filter.listing_type);
    }
    
    if (filter.min_price) {
      query = query.gte('price', filter.min_price);
    }
    
    if (filter.max_price) {
      query = query.lte('price', filter.max_price);
    }
    
    if (filter.bedrooms?.length) {
      query = query.in('bedrooms', filter.bedrooms);
    }
    
    if (filter.bathrooms?.length) {
      query = query.in('bathrooms', filter.bathrooms);
    }
    
    if (filter.city) {
      query = query.ilike('city', `%${filter.city}%`);
    }
    
    if (filter.features?.length) {
      query = query.contains('features', filter.features);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw error;
    
    return data?.map(item => ({
      ...item,
      agent: item.agents ? { ...item.agents.users, ...item.agents, role: 'agent' } : undefined
    })) || [];
  }

  async searchNearby(lat: number, lng: number, radiusKm: number, limit = 20): Promise<Property[]> {
    const { data, error } = await db.rpc('find_nearby_properties', {
      lat,
      lng,
      radius_km: radiusKm
    }).limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  async incrementViews(id: string): Promise<boolean> {
    const { error } = await db.rpc('increment_property_views', { property_id: id });
    return !error;
  }

  async getFeatured(): Promise<Property[]> {
    const { data, error } = await db.from('properties')
      .select(`
        *,
        property_images!inner(*),
        agents (
          *,
          users (
            full_name,
            phone,
            avatar_url
          )
        )
      `)
      .eq('status', 'active')
      .order('views_count', { ascending: false })
      .limit(8);

    if (error) throw error;
    return data || [];
  }
}

// Visit Repository
class VisitRepository extends BaseRepository<Visit> {
  constructor() {
    super('visits');
  }

  async findByUser(userId: string): Promise<Visit[]> {
    const { data, error } = await db.from('visits')
      .select(`
        *,
        properties (
          title,
          address,
          price,
          property_images!inner(url)
        ),
        agents (
          users (
            full_name,
            phone
          )
        )
      `)
      .eq('visitor_id', userId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findByAgent(agentId: string): Promise<Visit[]> {
    const { data, error } = await db.from('visits')
      .select(`
        *,
        properties (
          title,
          address
        ),
        users!visits_visitor_id_fkey (
          full_name,
          phone,
          email
        )
      `)
      .eq('agent_id', agentId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async isTimeSlotAvailable(agentId: string, date: string): Promise<boolean> {
    const { data, error } = await db.from('visits')
      .select('id')
      .eq('agent_id', agentId)
      .eq('scheduled_date', date)
      .in('status', ['scheduled', 'confirmed']);

    if (error) return false;
    return data?.length === 0;
  }
}

// Chat Repository
class ChatRepository {
  async findRoomsByUser(userId: string): Promise<ChatRoom[]> {
    const { data, error } = await db.from('chat_rooms')
      .select(`
        *,
        properties (
          title,
          property_images!inner(url)
        ),
        agents (
          users (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findRoomsByAgent(agentId: string): Promise<ChatRoom[]> {
    const { data, error } = await db.from('chat_rooms')
      .select(`
        *,
        properties (
          title,
          property_images!inner(url)
        ),
        users!chat_rooms_user_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq('agent_id', agentId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
    const { data, error } = await db.from('chat_messages')
      .select(`
        *,
        users (
          full_name,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async createMessage(message: Partial<ChatMessage>): Promise<ChatMessage> {
    const { data, error } = await db.from('chat_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;

    // Update room's last message timestamp
    await db.from('chat_rooms')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', message.room_id);

    return data;
  }
}

// Payment Repository
class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super('payments');
  }

  async findByUser(userId: string): Promise<Payment[]> {
    const { data, error } = await db.from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByStatus(status: string): Promise<Payment[]> {
    const { data, error } = await db.from('payments')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateStatus(id: string, status: string, metadata?: any): Promise<boolean> {
    const updateData: any = { status };
    if (metadata) {
      updateData.metadata = metadata;
    }

    const { error } = await db.from('payments')
      .update(updateData)
      .eq('id', id);

    return !error;
  }
}

// Notification Repository
class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super('notifications');
  }

  async findByUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = db.from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async markAsRead(id: string): Promise<boolean> {
    const { error } = await db.from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    return !error;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await db.from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    return !error;
  }
}

// Repository Factory
class RepositoryFactory {
  private static instances: Map<string, any> = new Map();

  static getUserRepository(): UserRepository {
    if (!this.instances.has('user')) {
      this.instances.set('user', new UserRepository());
    }
    return this.instances.get('user');
  }

  static getAgentRepository(): AgentRepository {
    if (!this.instances.has('agent')) {
      this.instances.set('agent', new AgentRepository());
    }
    return this.instances.get('agent');
  }

  static getPropertyRepository(): PropertyRepository {
    if (!this.instances.has('property')) {
      this.instances.set('property', new PropertyRepository());
    }
    return this.instances.get('property');
  }

  static getVisitRepository(): VisitRepository {
    if (!this.instances.has('visit')) {
      this.instances.set('visit', new VisitRepository());
    }
    return this.instances.get('visit');
  }

  static getChatRepository(): ChatRepository {
    if (!this.instances.has('chat')) {
      this.instances.set('chat', new ChatRepository());
    }
    return this.instances.get('chat');
  }

  static getPaymentRepository(): PaymentRepository {
    if (!this.instances.has('payment')) {
      this.instances.set('payment', new PaymentRepository());
    }
    return this.instances.get('payment');
  }

  static getNotificationRepository(): NotificationRepository {
    if (!this.instances.has('notification')) {
      this.instances.set('notification', new NotificationRepository());
    }
    return this.instances.get('notification');
  }
}

export {
  BaseRepository,
  UserRepository,
  AgentRepository,
  PropertyRepository,
  VisitRepository,
  ChatRepository,
  PaymentRepository,
  NotificationRepository,
  RepositoryFactory
};