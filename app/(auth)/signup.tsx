import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Button, Divider, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { Lock, Mail, Eye, EyeOff, User, ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/types';
import { AuthApiError } from '@supabase/supabase-js';

export default function SignUpScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    // Validate form fields
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create user in Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role // Include selected role
          }
        }
      });
      
      if (authError) throw authError;
      
      if (data.user) {
        // Create user profile with selected role
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              first_name: firstName,
              last_name: lastName,
              email: email,
              role: role, // Set the selected role
            }
          ]);
          
        if (profileError) throw profileError;
        
        // Navigate back to sign in
        router.replace('/(auth)');
      } else {
        setError('Signup initiated. Please check your email to confirm your account.');
      }
    } catch (error: any) {
      if (error instanceof AuthApiError && error.message.includes('User already registered')) {
        setError('This email is already in use. Please sign in instead.');
      } else {
        console.error('Error in handleSignUp:', error);
        setError(error.message || 'Failed to sign up. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Button 
          mode="text" 
          onPress={() => router.back()}
          style={styles.backButton}
          contentStyle={{ flexDirection: 'row-reverse' }}
          icon={({ size, color }) => (
            <ChevronLeft size={size} color={color} />
          )}
        >
          Back to Sign In
        </Button>
        
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Enter your details to get started</Text>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.formContainer}>
          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I am a:</Text>
            <SegmentedButtons
              value={role}
              onValueChange={value => setRole(value as UserRole)}
              buttons={[
                { value: 'tenant', label: 'Tenant' },
                { value: 'buyer', label: 'Buyer' },
                { value: 'owner', label: 'Property Owner' },
                { value: 'manager', label: 'Manager' }
              ]}
              style={styles.roleButtons}
            />
          </View>
          
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account-outline" />}
              />
            </View>
            
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account-outline" />}
              />
            </View>
          </View>
          
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
          
          <View style={styles.inputContainer}>
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={confirmSecureTextEntry}
              style={styles.input}
              left={<TextInput.Icon icon="lock-outline" />}
              right={<TextInput.Icon 
                icon={confirmSecureTextEntry ? "eye-outline" : "eye-off-outline"}
                onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)} 
              />}
            />
          </View>
          
          <Button
            mode="contained"
            onPress={handleSignUp}
            style={styles.signUpButton}
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>
          
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text style={styles.orText}>OR</Text>
            <Divider style={styles.divider} />
          </View>
          
          <Button
            mode="outlined"
            onPress={() => router.replace('/(auth)')}
            style={styles.signInButton}
          >
            Sign In
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
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.m,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
  roleContainer: {
    marginBottom: spacing.m,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.s,
    color: theme.colors.onSurface,
  },
  roleButtons: {
    marginBottom: spacing.m,
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
  formContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: spacing.l,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: spacing.m,
  },
  halfInput: {
    width: '48%',
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  signUpButton: {
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
  signInButton: {
    marginTop: spacing.s,
    borderColor: theme.colors.primary,
    paddingVertical: 4,
  },
});