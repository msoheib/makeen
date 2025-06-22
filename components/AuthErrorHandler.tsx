import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { theme, spacing } from '@/lib/theme';
import { useTranslation } from '@/lib/useTranslation';

interface AuthErrorHandlerProps {
  error?: string | null;
  onRetry?: () => void;
  showRetryOption?: boolean;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({
  error,
  onRetry,
  showRetryOption = true,
}) => {
  const { t } = useTranslation('common');
  const { retryAuth, logout } = useAuth();
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  // Check if the error is auth-related
  const isAuthError = error && (
    error.includes('token') ||
    error.includes('session') ||
    error.includes('expired') ||
    error.includes('unauthorized') ||
    error.includes('Invalid Refresh Token')
  );

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
      return;
    }

    setIsRetrying(true);
    
    try {
      const result = await retryAuth();
      
      if (!result.success) {
        // If retry fails, redirect to login
        await logout();
        router.replace('/(auth)');
      }
    } catch (error) {
      console.error('Retry failed:', error);
      await logout();
      router.replace('/(auth)');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)');
  };

  if (!isAuthError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon 
              source="alert-circle-outline" 
              size={48} 
              color={theme.colors.error} 
            />
          </View>
          
          <Text variant="headlineSmall" style={styles.title}>
            {t('auth.sessionExpired')}
          </Text>
          
          <Text variant="bodyMedium" style={styles.message}>
            {t('auth.sessionExpiredMessage')}
          </Text>
          
          {showRetryOption && (
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleRetry}
                loading={isRetrying}
                disabled={isRetrying}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                {t('auth.retryConnection')}
              </Button>
              
              <Button
                mode="outlined"
                onPress={handleSignOut}
                disabled={isRetrying}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                {t('auth.signInAgain')}
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

export default AuthErrorHandler;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
    backgroundColor: theme.colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  content: {
    alignItems: 'center',
    padding: spacing.l,
  },
  iconContainer: {
    marginBottom: spacing.m,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.m,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing.l,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.m,
  },
  button: {
    width: '100%',
  },
  buttonContent: {
    paddingVertical: spacing.s,
  },
});