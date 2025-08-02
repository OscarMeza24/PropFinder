// Configuración global para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5432/propfinder_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Mock de console.log para tests más limpios
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
