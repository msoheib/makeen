import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

interface SplashScreenProps {
  onFinish: () => void;
  isInitialized: boolean;
}

const { width, height } = Dimensions.get('window');

export const CustomSplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish, 
  isInitialized 
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [logoScale] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Keep the native splash screen visible
    SplashScreen.preventAutoHideAsync();

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide splash screen after minimum duration or when initialized
    const timer = setTimeout(() => {
      if (isInitialized) {
        handleFinish();
      }
    }, 2500); // Minimum 2.5 seconds display

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        handleFinish();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  const handleFinish = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      SplashScreen.hideAsync();
      onFinish();
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} testID="splash-screen">
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
          {/* Logo Image */}
          <View style={styles.logoImageContainer}>
            <Image 
              source={require('@/assets/images/splash-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* App Title */}
          <Text style={styles.mainTitle}>Makeen</Text>
          <Text style={styles.subtitle}>مكين</Text>
        </Animated.View>

        {/* Loading Section */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color="#FFFFFF" 
            style={styles.loader}
          />
          <Text style={styles.loadingText}>
            {isInitialized ? 'Ready!' : 'Initializing...'}
          </Text>
        </View>

        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#663399', // Purple background to match Makeen branding
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoImageContainer: {
    width: 200, // Increased size for better visibility
    height: 200, // Increased size for better visibility  
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 5,
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loader: {
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.9,
  },
  versionText: {
    position: 'absolute',
    bottom: 50,
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
  },
});

export default CustomSplashScreen; 