import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Button, Divider, Checkbox } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setUser = useAppStore(state => state.setUser);
  const setAuthenticated = useAppStore(state => state.setAuthenticated);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('Attempting sign-in for email:', email);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Supabase auth.signInWithPassword response:', { data, signInError });
      
      if (signInError) {
        console.error('Supabase auth.signInWithPassword error:', signInError);
        throw signInError;
      }
      
      if (data.user) {
        console.log('Sign-in successful for user ID:', data.user.id, 'Attempting to fetch profile.');
        // Fetch user profile details
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        console.log('Supabase profiles.select response:', { profileData, profileError });
          
        if (profileError) {
          console.error('Supabase profiles.select error (likely cause of JSON object/406 error):', profileError);
          throw profileError;
        }
        
        if (!profileData) {
          console.error('Profile data is null or undefined even after a successful select without error. This should not happen if profileError is null.');
          throw new Error('User profile not found after sign-in, but no specific database error was returned.');
        }
        
        console.log('Profile fetched successfully:', profileData);
        // Set user in global state
        setUser(profileData);
        setAuthenticated(true);
        
        // Navigate to the main app
        router.replace('/(drawer)');
      } else {
        // This case should ideally not be reached if signInError is null, 
        // as data.user should be present on successful sign-in.
        console.warn('Supabase auth.signInWithPassword did not return a user object, but no explicit error was thrown.');
        setError('Sign-in failed: No user data returned.');
      }
    } catch (error: any) {
      console.error('Error in handleSignIn:', error);
      setError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg' }} 
            style={styles.logo} 
          />
          <Text style={styles.title}>Property Management System</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email-outline" />}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={secureTextEntry}
              style={styles.input}
              left={<TextInput.Icon icon="lock-outline" />}
              right={<TextInput.Icon 
                icon={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                onPress={() => setSecureTextEntry(!secureTextEntry)} 
              />}
            />
          </View>
          
          <View style={styles.rememberForgotRow}>
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
                color={theme.colors.primary}
              />
              <Text style={styles.rememberText}>Remember me</Text>
            </View>
            <Button
              mode="text"
              onPress={() => {}}
              labelStyle={styles.forgotText}
            >
              Forgot password?
            </Button>
          </View>
          
          <Button
            mode="contained"
            onPress={handleSignIn}
            style={styles.signInButton}
            loading={loading}
            disabled={loading}
          >
            Sign In
          </Button>
          
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text style={styles.orText}>OR</Text>
            <Divider style={styles.divider} />
          </View>
          
          <Button
            mode="outlined"
            onPress={handleSignUp}
            style={styles.signUpButton}
          >
            Create Account
          </Button>
          
          {/* EMERGENCY DEMO BYPASS */}
          <Button
            mode="contained"
            onPress={() => {
              console.log('🚨 EMERGENCY DEMO BYPASS');
              setUser({ 
                id: 'demo-user', 
                email: 'demo@realestatemg.com', 
                role: 'admin',
                first_name: 'Demo',
                last_name: 'User',
                created_at: new Date().toISOString(),
                phone: null,
                address: null,
                city: null,
                country: null,
                nationality: null,
                id_number: null,
                is_foreign: false,
                profile_type: 'admin',
                status: 'active',
                updated_at: new Date().toISOString()
              });
              setAuthenticated(true);
              router.replace('/(drawer)');
            }}
            style={[styles.signUpButton, { backgroundColor: '#ff4444', marginTop: 10 }]}
            labelStyle={{ color: 'white' }}
          >
            🚨 EMERGENCY DEMO LOGIN
          </Button>
          
          {/* TEST PROXY BUTTON */}
          <Button
            mode="outlined"
            onPress={async () => {
              console.log('🧪 Testing CORS proxy...');
              try {
                const response = await fetch('http://localhost:3001/health');
                const data = await response.json();
                console.log('✅ Proxy health check:', data);
                alert('✅ Proxy is working! ' + JSON.stringify(data));
              } catch (error) {
                console.error('❌ Proxy test failed:', error);
                alert('❌ Proxy test failed: ' + error.message);
              }
            }}
            style={[styles.signUpButton, { marginTop: 10 }]}
          >
            🧪 Test CORS Proxy
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.m,
    ...shadows.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    ...shadows.small,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: spacing.l,
  },
  inputContainer: {
    marginBottom: spacing.m,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    color: theme.colors.onSurfaceVariant,
  },
  forgotText: {
    color: theme.colors.primary,
  },
  signInButton: {
    marginBottom: spacing.m,
    paddingVertical: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.m,
  },
  divider: {
    flex: 1,
  },
  orText: {
    marginHorizontal: spacing.s,
    color: theme.colors.onSurfaceVariant,
  },
  signUpButton: {
    marginTop: spacing.s,
    borderColor: theme.colors.primary,
    paddingVertical: 4,
  },
  errorContainer: {
    backgroundColor: theme.colors.errorContainer,
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.m,
  },
  errorText: {
    color: theme.colors.error,
  },
});