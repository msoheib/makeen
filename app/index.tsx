import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { ActivityIndicator, View, Platform } from 'react-native';
import { useTheme as useAppTheme } from '@/hooks/useTheme';

export default function AppIndex() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const setUser = useAppStore(state => state.setUser);
  const setAuthenticated = useAppStore(state => state.setAuthenticated);
  const { theme } = useAppTheme();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {      
      const { data: { session }, error } = await supabase.auth.getSession();      
      if (error) {
        console.error('❌ Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
        setAuthenticated(false);
      } else if (session?.user) {        // User is authenticated, fetch profile using maybeSingle to avoid 406 when zero rows
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();          
        if (!profileData && !profileError) {
          // Create a default profile if missing
          const defaultRole = 'tenant';
          const defaultProfileType = 'tenant';
          const insertPayload: any = {
            id: session.user.id,
            email: session.user.email,
            first_name: session.user.user_metadata?.first_name ?? null,
            last_name: session.user.user_metadata?.last_name ?? null,
            role: defaultRole,
            profile_type: defaultProfileType,
            status: 'active',
          };

          const { data: created, error: insertErr } = await supabase
            .from('profiles')
            .insert(insertPayload)
            .select('*')
            .single();
          if (insertErr) {
            if (insertErr.code === '23505' || insertErr.message?.includes('duplicate')) {
              const { data: existing, error: fetchErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              if (fetchErr) {
                console.error('❌ Error fetching existing profile after duplicate:', fetchErr);
                setIsAuthenticated(false);
                setUser(null);
                setAuthenticated(false);
              } else {
                profileData = existing;
              }
            } else {
              console.error('❌ Error creating default profile:', insertErr);
              setIsAuthenticated(false);
              setUser(null);
              setAuthenticated(false);
            }
          } else {
            profileData = created;
          }
        } else if (profileError) {
          console.error('❌ Error fetching profile:', profileError);
          setIsAuthenticated(false);
          setUser(null);
          setAuthenticated(false);
        } else {          // Set user in global state
          setUser(profileData);
          setAuthenticated(true);
          setIsAuthenticated(true);
        }
      } else {        // No session
        setIsAuthenticated(false);
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('💥 Unexpected error checking auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      setAuthenticated(false);
    } finally {      setIsLoading(false);
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
