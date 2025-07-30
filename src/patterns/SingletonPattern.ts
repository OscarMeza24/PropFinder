/**
 * Singleton Pattern Implementation
 * Ensures only one instance of critical services exists
 */

// Database Connection Singleton
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connectionString: string;
  private isConnected: boolean = false;

  private constructor() {
    this.connectionString = import.meta.env.VITE_SUPABASE_URL || '';
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public connect(): void {
    if (!this.isConnected) {
      // Connection logic here
      this.isConnected = true;
      console.log('Database connected');
    }
  }

  public getConnectionString(): string {
    return this.connectionString;
  }
}

// Configuration Manager Singleton
class ConfigManager {
  private static instance: ConfigManager;
  private config: Record<string, any > = {};

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): void {
    this.config = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
      paypalClientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
      mercadoPagoPublicKey: import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      mapboxApiKey: import.meta.env.VITE_MAPBOX_API_KEY,
    };
  }

  public get(key: string): any {
    return this.config[key];
  }

  public set(key: string, value: any): void {
    this.config[key] = value;
  }
}

// Logger Singleton
class Logger {
  private static instance: Logger;
  private logs: Array<{ timestamp: Date; level: string; message: string }> = [];

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(level: 'info' | 'warn' | 'error', message: string): void {
    const logEntry = {
      timestamp: new Date(),
      level,
      message
    };
    
    this.logs.push(logEntry);
    console[level](`[${logEntry.timestamp.toISOString()}] ${level.toUpperCase()}: ${message}`);
  }

  public getLogs(): Array<{ timestamp: Date; level: string; message: string }> {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

export { DatabaseConnection, ConfigManager, Logger };