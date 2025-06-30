import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { ActivityIndicator, View, Platform } from 'react-native';
import { theme } from '@/lib/theme';

export default function AppIndex() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const setUser = useAppStore(state => state.setUser);
  const setAuthenticated = useAppStore(state => state.setAuthenticated);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status...');
      console.log('Platform:', Platform.OS);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('Session check result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        error: error?.message || 'none'
      });
      
      if (error) {
        console.error('❌ Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
        setAuthenticated(false);
      } else if (session?.user) {
        console.log('✅ User session found, fetching profile...');
        // User is authenticated, fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        console.log('Profile fetch result:', {
          hasProfile: !!profileData,
          error: profileError?.message || 'none'
        });
          
        if (profileError) {
          console.error('❌ Error fetching profile:', profileError);
          setIsAuthenticated(false);
          setUser(null);
          setAuthenticated(false);
        } else {
          console.log('✅ Profile fetched successfully');
          // Set user in global state
          setUser(profileData);
          setAuthenticated(true);
          setIsAuthenticated(true);
        }
      } else {
        console.log('ℹ️ No session found');
        // No session
        setIsAuthenticated(false);
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('💥 Unexpected error checking auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      setAuthenticated(false);
    } finally {
      console.log('🏁 Auth check completed');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)" />;
  }
} 