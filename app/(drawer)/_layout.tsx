import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { Modal, View, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { realTimeService } from '@/lib/realtime';
import SideBar from '../../components/SideBar';

export default function DrawerLayout() {
  const router = useRouter();
  const { user, setUser, setAuthenticated, setLoading, sidebarOpen, setSidebarOpen } = useAppStore();

  useEffect(() => {
    // Check if user is authenticated on app start
    const checkAuthState = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthenticated(false);
          router.replace('/(auth)');
          return;
        }

        if (session?.user) {
          // Fetch user profile from database
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            setAuthenticated(false);
            router.replace('/(auth)');
            return;
          }

          if (profileData) {
            setUser(profileData);
            setAuthenticated(true);
            // Initialize real-time service after successful authentication
            // TEMPORARILY DISABLED for debugging logout issue
            // realTimeService.initialize().catch(console.error);
          } else {
            setAuthenticated(false);
            router.replace('/(auth)');
          }
        } else {
          setAuthenticated(false);
          router.replace('/(auth)');
        }
      } catch (error) {
        console.error('Error in auth check:', error);
        setAuthenticated(false);
        router.replace('/(auth)');
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setAuthenticated(false);
        // Clean up real-time service on sign out
        // TEMPORARILY DISABLED for debugging logout issue
        // realTimeService.cleanup().catch(console.error);
        router.replace('/(auth)');
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData && !profileError) {
          setUser(profileData);
          setAuthenticated(true);
          // Initialize real-time service after successful authentication
          // TEMPORARILY DISABLED for debugging logout issue
          // realTimeService.initialize().catch(console.error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
        <Stack.Screen name="documents" options={{ headerShown: false }} />
      </Stack>
      
      <Modal
        visible={sidebarOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.overlay} onTouchEnd={() => setSidebarOpen(false)} />
          <View style={styles.sidebarContainer}>
            <SideBar navigation={{ closeDrawer: () => setSidebarOpen(false) }} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebarContainer: {
    width: 280,
    backgroundColor: '#f4f4f4',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
}); 