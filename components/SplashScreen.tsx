import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
          {/* Building Icon */}
          <View style={styles.buildingIcon}>
            <View style={styles.building}>
              {/* Roof */}
              <View style={styles.roof} />
              {/* Building Body */}
              <View style={styles.buildingBody}>
                {/* Windows */}
                <View style={styles.windowRow}>
                  <View style={styles.window} />
                  <View style={styles.window} />
                </View>
                <View style={styles.windowRow}>
                  <View style={styles.window} />
                  <View style={styles.window} />
                </View>
                {/* Door */}
                <View style={styles.door}>
                  <View style={styles.doorHandle} />
                </View>
              </View>
            </View>
          </View>

          {/* App Title */}
          <Text style={styles.mainTitle}>Real Estate</Text>
          <Text style={styles.subtitle}>MG</Text>
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
    backgroundColor: '#1976D2', // Strong blue background
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
  buildingIcon: {
    marginBottom: 20,
    alignItems: 'center',
  },
  building: {
    alignItems: 'center',
  },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  buildingBody: {
    width: 50,
    height: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 5,
  },
  windowRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  window: {
    width: 8,
    height: 8,
    backgroundColor: '#1976D2',
    marginHorizontal: 4,
    borderRadius: 1,
  },
  door: {
    width: 12,
    height: 18,
    backgroundColor: '#1976D2',
    marginTop: 2,
    borderRadius: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 2,
  },
  doorHandle: {
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
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