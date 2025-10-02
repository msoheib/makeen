import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Card, Text, Portal, Modal } from 'react-native-paper';
import { useTranslation } from '@/lib/useTranslation';
import { resetToEnglish, getCurrentLanguage } from '@/lib/i18n';

interface LanguageDebuggerProps {
  visible?: boolean;
  onClose?: () => void;
}

export default function LanguageDebugger({ visible = false, onClose }: LanguageDebuggerProps) {
  const { language, isRTL, changeLanguage } = useTranslation();
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [storedLang, setStoredLang] = useState<string | null>(null);

  useEffect(() => {
    // Get current language from i18n
    const current = getCurrentLanguage();
    setCurrentLang(current);

    // Get stored language from localStorage (web) or AsyncStorage (native)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const stored = window.localStorage?.getItem('app-language');
      setStoredLang(stored);
    }
  }, [language]);

  const handleResetToEnglish = async () => {
    try {
      await resetToEnglish();
      setCurrentLang('en');
      setStoredLang('en');
      
      // Clear web localStorage
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage?.removeItem('app-language');
      }
      
      // Reload the page to apply changes
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to reset language:', error);
    }
  };

  const handleSwitchToArabic = async () => {
    try {
      await changeLanguage('ar');
      setCurrentLang('ar');
      setStoredLang('ar');
    } catch (error) {
      console.error('Failed to switch to Arabic:', error);
    }
  };

  const handleSwitchToEnglish = async () => {
    try {
      await changeLanguage('en');
      setCurrentLang('en');
      setStoredLang('en');
    } catch (error) {
      console.error('Failed to switch to English:', error);
    }
  };

  if (!visible) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modal}
      >
        <Card style={styles.card}>
          <Card.Title title="Language Debugger" />
          <Card.Content>
            <Text style={styles.info}>
              <Text style={styles.label}>Current Language:</Text> {currentLang}
            </Text>
            <Text style={styles.info}>
              <Text style={styles.label}>Stored Language:</Text> {storedLang || 'None'}
            </Text>
            <Text style={styles.info}>
              <Text style={styles.label}>Is RTL:</Text> {isRTL ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.info}>
              <Text style={styles.label}>Platform:</Text> {Platform.OS}
            </Text>
            
            <View style={styles.buttonContainer}>
              <Button 
                mode="contained" 
                onPress={handleSwitchToEnglish}
                style={styles.button}
              >
                Switch to English
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSwitchToArabic}
                style={styles.button}
              >
                Switch to Arabic
              </Button>
              <Button 
                mode="outlined" 
                onPress={handleResetToEnglish}
                style={[styles.button, styles.resetButton]}
              >
                Reset to English
              </Button>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button onPress={onClose}>Close</Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  info: {
    marginBottom: 8,
    fontSize: 14,
  },
  label: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 16,
    gap: 8,
  },
  button: {
    marginVertical: 4,
  },
  resetButton: {
    borderColor: '#ff4444',
  },
});

