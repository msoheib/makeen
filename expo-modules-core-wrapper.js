// Wrapper for expo-modules-core to bypass TypeScript loading issues in Node.js 22
// This provides the essential exports that Expo needs without loading TypeScript files

module.exports = {
  // Core module functions
  requireNativeModule: () => ({}),
  NativeModulesProxy: {},
  EventEmitter: class EventEmitter {
    constructor() {
      this.listeners = {};
    }
    addListener(event, listener) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(listener);
    }
    removeListener(event, listener) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
      }
    }
    emit(event, ...args) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(listener => listener(...args));
      }
    }
  },
  
  // Platform detection
  Platform: {
    OS: typeof window !== 'undefined' ? 'web' : 'node',
    select: (options) => options[typeof window !== 'undefined' ? 'web' : 'default'] || options.default,
  },
  
  // Permissions (stub)
  PermissionsInterface: {},
  
  // Web module registration (stub)
  registerWebModule: () => {},
  
  // Reload functionality (stub)
  reload: () => {},
  
  // Shared objects (stub)
  SharedObject: class SharedObject {},
  SharedRef: class SharedRef {},
  
  // UUID (basic implementation)
  uuid: {
    v4: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    })
  },
  
  // Environment detection
  environment: {
    isDevice: false,
    isEmulator: false,
  },
  
  // Error classes (basic)
  errors: {
    UnavailabilityError: class UnavailabilityError extends Error {},
    CodedError: class CodedError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    }
  }
}; 