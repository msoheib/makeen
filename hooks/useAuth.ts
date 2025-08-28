import { useState, useEffect } from 'react';
import { supabase, getSession, signOut, clearSession, isAuthenticated, refreshSession } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const { setUser, setAuthenticated, setLoading } = useAppStore();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[useAuth] Initializing authentication');
        
        // First check if we have a valid session
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          const { session, error } = await getSession();
          
          if (mounted && session && !error) {
            console.log('[useAuth] Valid session found');
            setAuthState({
              user: session.user,
              session,
              loading: false,
              error: null,
            });
            
            // Update store
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              phone: session.user.user_metadata?.phone || '',
              role: session.user.user_metadata?.role || 'tenant',
              created_at: session.user.created_at,
              updated_at: new Date().toISOString(),
            });
            setAuthenticated(true);
          } else {
            console.log('[useAuth] No valid session found');
            if (mounted) {
              setAuthState({
                user: null,
                session: null,
                loading: false,
                error: error?.message || null,
              });
              setUser(null);
              setAuthenticated(false);
            }
          }
        } else {
          console.log('[useAuth] User not authenticated');
          if (mounted) {
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: null,
            });
            setUser(null);
            setAuthenticated(false);
          }
        }
      } catch (error: any) {
        console.error('[useAuth] Auth initialization error:', error);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: error.message,
          });
          setUser(null);
          setAuthenticated(false);
          await clearSession();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [setUser, setAuthenticated, setLoading]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('[useAuth] User signed in');
          setAuthState({
            user: session.user,
            session,
            loading: false,
            error: null,
          });
          
          // Update store
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            phone: session.user.user_metadata?.phone || '',
            role: session.user.user_metadata?.role || 'tenant',
            created_at: session.user.created_at,
            updated_at: new Date().toISOString(),
          });
          setAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
          console.log('[useAuth] User signed out');
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null,
          });
          
          // Update store
          setUser(null);
          setAuthenticated(false);
          await clearSession();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('[useAuth] Token refreshed');
          setAuthState(prev => ({
            ...prev,
            session,
            error: null,
          }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setAuthenticated]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  };

  // Sign up function
  const signUp = async (
    email: string, 
    password: string, 
    metadata: {
      first_name: string;
      last_name: string;
      phone?: string;
      role: string;
    }
  ) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  };

  // Sign out function
  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { error } = await signOut();
      
      if (error) {
        console.warn('[useAuth] Sign out error:', error.message);
      }
      
      // Always clear local state even if sign out fails
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      
      setUser(null);
      setAuthenticated(false);
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('[useAuth] Logout error:', error);
      
      // Still clear local state
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      
      setUser(null);
      setAuthenticated(false);
      
      return { success: true, error: null };
    }
  };

  // Retry authentication (useful for recovering from token errors)
  const retryAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Try to refresh the session
      const { session, error } = await refreshSession();
      
      if (session && !error) {
        console.log('[useAuth] Session recovered successfully');
        setAuthState({
          user: session.user,
          session,
          loading: false,
          error: null,
        });
        
        // Update store
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          phone: session.user.user_metadata?.phone || '',
          role: session.user.user_metadata?.role || 'tenant',
          created_at: session.user.created_at,
          updated_at: new Date().toISOString(),
        });
        setAuthenticated(true);
        
        return { success: true, error: null };
      } else {
        console.log('[useAuth] Session recovery failed');
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: error?.message || 'Session recovery failed',
        });
        
        setUser(null);
        setAuthenticated(false);
        
        return { success: false, error: error?.message || 'Session recovery failed' };
      }
    } catch (error: any) {
      console.error('[useAuth] Retry auth error:', error);
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: error.message,
      });
      
      setUser(null);
      setAuthenticated(false);
      
      return { success: false, error: error.message };
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    logout,
    retryAuth,
    isAuthenticated: !!authState.session,
  };
};