import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Get Supabase URL and anon key from environment variables
const originalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
                           Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
                           'https://fbabpaorcvatejkrelrf.supabase.co';

// Directly use Supabase URL (CORS must be enabled in Supabase dashboard)
const supabaseUrl = originalSupabaseUrl;

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                       Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYWJwYW9yY3ZhdGVqa3JlbHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjYzMzMsImV4cCI6MjA2Mzg0MjMzM30.L_DLnMQUw7cepGKjtrbkFZ_E6Rsz4pecAtnUrbc0F5w';

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

// Initialize Supabase client
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

// Export hooks for session management
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};