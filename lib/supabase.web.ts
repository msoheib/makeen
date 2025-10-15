import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

// Environment variables for Supabase
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ||
                          'https://fbabpaorcvatejkrelrf.supabase.co';

export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
                              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYWJwYW9yY3ZhdGVqa3JlbHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjYzMzMsImV4cCI6MjA2Mzg0MjMzM30.L_DLnMQUw7cepGKjtrbkFZ_E6Rsz4pecAtnUrbc0F5w';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Encryption key for secure storage (in production, this should be environment-specific)
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'makeen-property-management-secure-key-2025';

/**
 * Secure localStorage wrapper with encryption for sensitive data
 */
class SecureWebStorage {
  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  }

  private decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      // Decrypt if it's an auth token
      if (key.includes('auth') || key.includes('session') || key.includes('token')) {
        return this.decrypt(encrypted);
      }
      return encrypted;
    } catch (error) {
      console.error('[SecureStorage] Failed to get item:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Encrypt if it's an auth token
      if (key.includes('auth') || key.includes('session') || key.includes('token')) {
        const encrypted = this.encrypt(value);
        localStorage.setItem(key, encrypted);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('[SecureStorage] Failed to set item:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[SecureStorage] Failed to remove item:', error);
    }
  }
}

// Initialize Supabase client with secure storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new SecureWebStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'real-estate-mg-web',
    },
  },
});

// Session management with error handling
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('[Auth] Session retrieval error:', error.message);
      // If it's a refresh token error, clear the session
      if (error.message.includes('refresh') || error.message.includes('token')) {
        await clearSession();
        return { session: null, error };
      }
    }

    return { session: data.session, error };
  } catch (error: any) {
    console.error('[Auth] Unexpected session error:', error);
    await clearSession();
    return { session: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    // Clear user context cache on logout
    try {
      const { clearUserContextCache } = await import('./security');
      clearUserContextCache();
    } catch (error) {
      // Ignore if security module can't be loaded
    }

    if (error) {
      console.warn('[Auth] Sign out error:', error.message);
      // Even if sign out fails, clear local session
      await clearSession();
    }

    return { error };
  } catch (error: any) {
    console.error('[Auth] Unexpected sign out error:', error);
    await clearSession();
    return { error };
  }
};

// Clear local session data
export const clearSession = async () => {
  try {
    const storage = new SecureWebStorage();

    // Clear Supabase auth tokens
    await storage.removeItem('supabase.auth.token');
    await storage.removeItem('sb-' + supabaseUrl.replace('https://', '').replace('.supabase.co', '') + '-auth-token');

    // Clear localStorage keys that might contain auth data
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('session'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('[Auth] Error clearing session:', error);
  }
};

// Check if user is authenticated with error handling
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { session, error } = await getSession();

    if (error || !session) {
      return false;
    }

    // Check if session is expired
    if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
      await clearSession();
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Auth] Authentication check failed:', error);
    return false;
  }
};

// Refresh session with error handling
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.warn('[Auth] Session refresh failed:', error.message);
      await clearSession();
      return { session: null, error };
    }
    return { session: data.session, error: null };
  } catch (error: any) {
    console.error('[Auth] Unexpected refresh error:', error);
    await clearSession();
    return { session: null, error };
  }
};

// Handle auth state changes
if (supabase && supabase.auth) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] State change:', event);
    if (event === 'SIGNED_OUT') {
      await clearSession();
    }
  });
}
