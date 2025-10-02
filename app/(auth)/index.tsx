import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, ScrollView, Platform, I18nManager, Alert } from 'react-native';
import { Text, TextInput, Button, Divider, Checkbox } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { useCommonTranslation } from '@/lib/useTranslation';
import { navigateBack, navigateBackToSection } from '@/lib/navigation';
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
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error('Supabase auth.signInWithPassword error:', signInError);
        throw signInError;
      }
      if (data.user) {
        // Fetch user profile details (avoid 406 by using maybeSingle)
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        // If no row exists, create a default profile for the signed-in user
        if (!profileData && !profileError) {
          const defaultRole = 'tenant';
          const defaultProfileType = 'tenant';
          const insertPayload: any = {
            id: data.user.id,
            email: data.user.email,
            first_name: data.user.user_metadata?.first_name ?? null,
            last_name: data.user.user_metadata?.last_name ?? null,
            role: defaultRole,
            profile_type: defaultProfileType,
            status: 'active',
          };

          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(insertPayload)
            .select('*')
            .single();

          if (insertError) {
            // If duplicate due to race, fetch again
            if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
              const { data: existing, error: fetchErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
              if (fetchErr) {
                console.error('Failed to fetch existing profile after duplicate:', fetchErr);
                throw fetchErr;
              }
              profileData = existing;
            } else {
              console.error('Failed to create profile after sign-in:', insertError);
              throw insertError;
            }
          } else {
            profileData = createdProfile;
          }
        } else if (profileError) {
          console.error('Supabase profiles.select error (likely cause of JSON object/406 error):', profileError);
          throw profileError;
        }

        if (!profileData) {
          throw new Error('User profile not found after sign-in.');
        }

        // Check if user is approved
        if (profileData.status === 'pending') {
          Alert.alert(
            'Account Pending Approval',
            'Your account is currently pending approval by a property manager. You will receive notification once your account is approved.',
            [{ text: 'OK' }]
          );
          
          // Sign out the user
          await supabase.auth.signOut();
          return;
        }
        
        if (profileData.status === 'rejected') {
          const reason = profileData.rejected_reason ? `\n\nReason: ${profileData.rejected_reason}` : '';
          Alert.alert(
            'Account Rejected',
            `Your account registration has been rejected by a property manager.${reason}\n\nPlease contact support if you believe this is an error.`,
            [{ text: 'OK' }]
          );
          
          // Sign out the user
          await supabase.auth.signOut();
          return;
        }
        
        if (profileData.status === 'inactive') {
          Alert.alert(
            'Account Deactivated',
            'Your account has been deactivated. Please contact support for assistance.',
            [{ text: 'OK' }]
          );
          
          // Sign out the user
          await supabase.auth.signOut();
          return;
        }
        
        // Set user in global state
        setUser(profileData);
        setAuthenticated(true);
        
        // Navigate to the main app
        router.replace('/(tabs)');
      } else {
        // This case should ideally not be reached if signInError is null, 
        // as data.user should be present on successful sign-in.
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
      writingDirection: isRTL ? 'rtl' : 'ltr',
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
    backgroundColor: '#4C2661', // Updated to match primary theme color (button color)
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.m, // Reduced from spacing.xl to give more space for larger logo
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%', // Ensure full width is available for logo
  },
  logo: {
    width: 300, // Updated to match signup page size (was 120)
    height: 300, // Updated to match signup page size (was 120)
    marginBottom: spacing.m,
    backgroundColor: 'rgba(255,255,255,0.1)', // Add slight background to match signup page
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
