import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, ScrollView, Platform, I18nManager } from 'react-native';
import { Text, TextInput, Button, Divider, Checkbox } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { useCommonTranslation } from '@/lib/useTranslation';
import { getTextAlign, getFlexDirection } from '@/lib/rtl';

export default function SignInScreen() {
  const router = useRouter();
  const { t, isRTL } = useCommonTranslation();
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
      setError(t('enterEmailPassword', 'Please enter your email and password.'));
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
        router.replace('/(tabs)');
      } else {
        // This case should ideally not be reached if signInError is null, 
        // as data.user should be present on successful sign-in.
        console.warn('Supabase auth.signInWithPassword did not return a user object, but no explicit error was thrown.');
        setError(t('signInFailed', 'Sign-in failed: No user data returned.'));
      }
    } catch (error: any) {
      console.error('Error in handleSignIn:', error);
      setError(error.message || t('signInError', 'Failed to sign in. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup');
  };

  const rtlStyles = {
    container: {
      direction: isRTL ? 'rtl' : 'ltr',
    },
    textAlign: {
      textAlign: getTextAlign('left'),
    },
    textAlignCenter: {
      textAlign: getTextAlign('center'),
    },
    row: {
      flexDirection: getFlexDirection('row'),
    },
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, rtlStyles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/splash-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, rtlStyles.textAlignCenter]}>
            {t('propertyManagementSystem', 'نظام إدارة العقارات')}
          </Text>
          <Text style={[styles.subtitle, rtlStyles.textAlignCenter]}>
            {t('signInToAccount', 'تسجيل الدخول إلى حسابك')}
          </Text>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, rtlStyles.textAlign]}>{error}</Text>
          </View>
        )}
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              label={t('email', 'البريد الإلكتروني')}
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
              label={t('password', 'كلمة المرور')}
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
          
          <View style={[styles.rememberForgotRow, rtlStyles.row]}>
            <View style={[styles.checkboxContainer, rtlStyles.row]}>
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
                color={theme.colors.primary}
              />
              <Text style={[styles.rememberText, rtlStyles.textAlign]}>
                {t('rememberMe', 'تذكرني')}
              </Text>
            </View>
            <Button
              mode="text"
              onPress={() => {}}
              labelStyle={[styles.forgotText, rtlStyles.textAlign]}
            >
              {t('forgotPassword', 'نسيت كلمة المرور؟')}
            </Button>
          </View>
          
          <Button
            mode="contained"
            onPress={handleSignIn}
            style={styles.signInButton}
            loading={loading}
            disabled={loading}
          >
            {t('login', 'تسجيل الدخول')}
          </Button>
          
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text style={styles.orText}>{t('or', 'أو')}</Text>
            <Divider style={styles.divider} />
          </View>
          
          <Button
            mode="outlined"
            onPress={handleSignUp}
            style={styles.signUpButton}
          >
            {t('createAccount', 'إنشاء حساب')}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#663399', // Purple background to match splash screen
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
    width: 120,
    height: 120,
    marginBottom: spacing.m,
    // Removed borderRadius and shadow as the logo image has its own design
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF', // White text for better contrast on purple background
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF', // White text for better contrast on purple background
    opacity: 0.9,
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