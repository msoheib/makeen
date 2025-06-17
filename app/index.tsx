import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { ActivityIndicator, View } from 'react-native';
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
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
        setAuthenticated(false);
      } else if (session?.user) {
        // User is authenticated, fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setIsAuthenticated(false);
          setUser(null);
          setAuthenticated(false);
        } else {
          // Set user in global state
          setUser(profileData);
          setAuthenticated(true);
          setIsAuthenticated(true);
        }
      } else {
        // No session
        setIsAuthenticated(false);
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Unexpected error checking auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      setAuthenticated(false);
    } finally {
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
    return <Redirect href="/(drawer)" />;
  } else {
    return <Redirect href="/(auth)" />;
  }
} 