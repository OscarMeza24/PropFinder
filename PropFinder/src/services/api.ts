const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const WEBSOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:5001";

// Asegurarse de que la URL base termine con /api pero sin doble barra
const ensureApiPrefix = (url: string) => {
  // Eliminar la barra final si existe
  const baseUrl = url.endsWith("/") ? url.slice(0, -1) : url;

  // Verificar si ya termina con /api
  if (!baseUrl.endsWith("/api")) {
    return `${baseUrl}/api`;
  }
  return baseUrl;
};

// Aplicar el prefijo /api si no está presente
const API_URL = ensureApiPrefix(API_BASE_URL);

// Tipos de datos
export interface User {
  id: number;
  email: string;
  name: string;
  role: "user" | "agent" | "admin";
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Property {
  id: number;
  agent_id: number;
  title: string;
  description?: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  property_type:
    | "house"
    | "apartment"
    | "condo"
    | "townhouse"
    | "land"
    | "commercial";
  status: "active" | "pending" | "sold" | "rented" | "deleted";
  images?: string[];
  features?: string[];
  agent_name?: string;
  agent_phone?: string;
  agent_email?: string;
  views?: number;
  contacts?: number;
  pendingVisits?: number;
  featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface PropertiesResponse {
  properties: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  room_id?: string;
  content: string;
  message_type: "text" | "image" | "file" | "location";
  is_read: boolean;
  read_at?: string;
  sender_name?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: "info" | "message" | "visit" | "payment" | "favorite";
  is_read: boolean;
  read_at?: string;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  other_user_id: number;
  other_user_name: string;
  other_user_email: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export interface Payment {
  id: string;
  status: string;
  amount: number;
  currency: string;
  propertyId: number;
  description: string;
}

export interface Kpi {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
}

export interface WeeklyActivity {
  name: string;
  vistas: number;
  mensajes: number;
}

export interface PopularProperty {
  id: number;
  name: string;
  views: number;
  favorites: number;
}

export interface AnalyticsDashboardResponse {
  kpis: Kpi[];
  weeklyActivity: WeeklyActivity[];
  popularProperties: PopularProperty[];
}

// Clase para manejar la API
class ApiService {
  private token: string | null = null;

  constructor() {
    // Recuperar token del localStorage al inicializar
    this.token = localStorage.getItem("token");
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Asegurarse de que el endpoint comience con / y no haya doble barra
    const formattedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    const url = `${API_URL}${formattedEndpoint}`;
    const config: RequestInit = {
      ...options,
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Métodos de autenticación
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: "user" | "agent";
    phone?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    this.setToken(response.token);
    return response;
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    this.setToken(response.token);
    return response;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>("/auth/profile");
  }

  async updateProfile(data: {
    name?: string;
    phone?: string;
  }): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Métodos de propiedades
  async getProperties(params?: {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    location?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PropertiesResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/properties${queryString ? `?${queryString}` : ""}`;

    // Usar fetch directo sin autenticación ya que este endpoint es público
    const url = `${API_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async getProperty(id: number): Promise<{ property: Property }> {
    return this.request<{ property: Property }>(`/properties/${id}`);
  }

  async createProperty(propertyData: {
    title: string;
    description?: string;
    price: number;
    address: string;
    city: string;
    state: string;
    zip_code?: string;
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    property_type: string;
    images?: string[];
    features?: string[];
    latitude?: number;
    longitude?: number;
  }): Promise<{ message: string; property: Property }> {
    return this.request<{ message: string; property: Property }>(
      "/properties",
      {
        method: "POST",
        body: JSON.stringify(propertyData),
      }
    );
  }

  async updateProperty(
    id: number,
    propertyData: Partial<Property>
  ): Promise<{ message: string; property: Property }> {
    return this.request<{ message: string; property: Property }>(
      `/properties/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(propertyData),
      }
    );
  }

  async deleteProperty(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/properties/${id}`, {
      method: "DELETE",
    });
  }

  async getMyProperties(params?: {
    page?: number;
    limit?: number;
  }): Promise<PropertiesResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/properties/agent/my-properties${
      queryString ? `?${queryString}` : ""
    }`;

    return this.request<PropertiesResponse>(endpoint);
  }

  // Métodos de pagos unificados
  // Métodos de Favoritos
  async getFavorites(): Promise<Property[]> {
    return this.request<Property[]>("/favorites", {
      method: "GET",
    });
  }

  async addFavorite(propertyId: number): Promise<any> {
    return this.request("/favorites", {
      method: "POST",
      body: JSON.stringify({ propertyId }),
    });
  }

  async removeFavorite(propertyId: number): Promise<any> {
    return this.request(`/favorites/${propertyId}`, {
      method: "DELETE",
    });
  }

  // Métodos de Analíticas
  async getWeeklyActivity(): Promise<WeeklyActivity[]> {
    return this.request<WeeklyActivity[]>("/analytics/weekly-activity");
  }

  // Métodos de pagos unificados
  async getPaymentProviders(): Promise<{ providers: string[] }> {
    return this.request<{ providers: string[] }>("/payments/providers");
  }

  async createPayment(data: {
    provider: "stripe" | "paypal";
    amount: number;
    currency?: string;
    description?: string;
    returnUrl?: string;
    cancelUrl?: string;
    propertyId?: number;
  }): Promise<{
    id: string;
    clientSecret?: string;
    status: string;
    paymentMethod: string;
    approvalUrl?: string;
    requiresApproval?: boolean;
    requiresAction?: boolean;
    requiresConfirmation?: boolean;
    additionalData?: Record<string, unknown>;
    paymentRecordId: number;
  }> {
    return this.request("/payments/create-payment", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async confirmPayment(data: {
    provider: "stripe" | "paypal";
    paymentId: string;
    additionalData?: Record<string, unknown>;
  }): Promise<{
    success: boolean;
    status: string;
    error?: string;
  }> {
    return this.request("/payments/confirm-payment", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Métodos de pagos (mantener para compatibilidad)
  async createStripePaymentIntent(data: {
    amount: number;
    currency?: string;
    propertyId?: number;
    description?: string;
  }): Promise<PaymentIntent> {
    return this.request<PaymentIntent>(
      "/payments/stripe/create-payment-intent",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async confirmStripePayment(
    paymentIntentId: string
  ): Promise<{ message: string; status: string }> {
    return this.request<{ message: string; status: string }>(
      "/payments/stripe/confirm-payment",
      {
        method: "POST",
        body: JSON.stringify({ paymentIntentId }),
      }
    );
  }

  async createPayPalPayment(data: {
    amount: number;
    currency?: string;
    propertyId?: number;
    description?: string;
  }): Promise<{ paymentId: string; approvalUrl: string }> {
    return this.request<{ paymentId: string; approvalUrl: string }>(
      "/payments/paypal/create-payment",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async executePayPalPayment(
    paymentId: string,
    payerId: string
  ): Promise<{ message: string; status: string; payment: Payment }> {
    return this.request<{ message: string; status: string; payment: Payment }>(
      "/payments/paypal/execute-payment",
      {
        method: "POST",
        body: JSON.stringify({ paymentId, payerId }),
      }
    );
  }

  async getPaymentHistory(params?: { page?: number; limit?: number }): Promise<{
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/payments/history${queryString ? `?${queryString}` : ""}`;

    return this.request(endpoint);
  }

  // Métodos de chat
  async getConversations(): Promise<{
    conversations?: Conversation[];
    data?: Conversation[];
    success?: boolean;
  }> {
    return this.request<{
      conversations?: Conversation[];
      data?: Conversation[];
      success?: boolean;
    }>("/conversations");
  }

  async getConversationMessages(
    otherUserId: number,
    params?: { page?: number; limit?: number }
  ): Promise<{
    messages: Message[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/conversations/${otherUserId}/messages${
      queryString ? `?${queryString}` : ""
    }`;

    return this.request(endpoint);
  }

  async createConversation(data: {
    receiverId: number;
    initialMessage?: string;
  }): Promise<{
    message: string;
    receiver: { id: number; name: string };
    initialMessageId?: number;
  }> {
    return this.request("/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Métodos de utilidad
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem("token", token);
  }

  getToken(): string | null {
    return this.token;
  }

  removeToken(): void {
    this.token = null;
    localStorage.removeItem("token");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Verificar si el token está expirado
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // WebSocket
  createWebSocketConnection(token: string): WebSocket {
    return new WebSocket(`${WEBSOCKET_URL}?token=${token}`);
  }

  // Métodos de notificaciones
  async getNotifications(
    unreadOnly = false,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    if (unreadOnly) {
      searchParams.append("unread_only", "true");
    }

    const queryString = searchParams.toString();
    const endpoint = `/notifications${queryString ? `?${queryString}` : ""}`;

    return this.request(endpoint);
  }

  async getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
    return this.request<{ unreadCount: number }>("/notifications/unread-count");
  }

  async markNotificationAsRead(id: string): Promise<{
    message: string;
    notification: Notification;
  }> {
    return this.request<{ message: string; notification: Notification }>(
      `/notifications/${id}/read`,
      {
        method: "PUT",
      }
    );
  }

  async markAllNotificationsAsRead(): Promise<{
    message: string;
    count: number;
  }> {
    return this.request<{ message: string; count: number }>(
      "/notifications/read-all",
      {
        method: "PUT",
      }
    );
  }

  async deleteNotification(id: string): Promise<void> {
    return this.request<void>(`/notifications/${id}`, {
      method: "DELETE",
    });
  }
}

// Instancia singleton
export const apiService = new ApiService();
export default apiService;
