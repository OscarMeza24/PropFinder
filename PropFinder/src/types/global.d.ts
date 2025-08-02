// Global type declarations for testing environment
interface CustomGlobal extends Omit<typeof globalThis, 'WebSocket' | 'localStorage'> {
  WebSocket: typeof WebSocket;
  localStorage: Storage;
}

declare const global: CustomGlobal;
