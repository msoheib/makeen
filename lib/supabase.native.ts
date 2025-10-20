import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
// Note: clearUserContextCache is imported dynamically to avoid circular dependency

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
                   Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                   'https://fbabpaorcvatejkrelrf.supabase.co';

export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                       Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYWJwYW9yY3ZhdGVqa3JlbHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjYzMzMsImV4cCI6MjA2Mzg0MjMzM30.L_DLnMQUw7cepGKjtrbkFZ_E6Rsz4pecAtnUrbc0F5w';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env files or app.json configuration.');
}

// Custom storage implementation for React Native
class ReactNativeStorage {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      // Return null if running server-side
      return null;
    } else {
      return SecureStore.getItemAsync(key);
    }
  }

  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }

  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
}

// Initialize Supabase client with enhanced error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new ReactNativeStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web' && typeof window !== 'undefined',
  },
  global: {
    headers: {
      'X-Client-Info': 'real-estate-mg',
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
    
    // Clear user context cache on logout (dynamic import to avoid circular dependency)
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
    const storage = new ReactNativeStorage();
    
    // Clear Supabase auth tokens
    await storage.removeItem('supabase.auth.token');
    await storage.removeItem('sb-' + supabaseUrl.replace('https://', '').replace('.supabase.co', '') + '-auth-token');
    
    // Clear any other auth-related storage
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Clear localStorage keys that might contain auth data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
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
    if (event === 'SIGNED_OUT') {
      await clearSession();
    }
  });
}
