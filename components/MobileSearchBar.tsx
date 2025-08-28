import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Keyboard
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Search, X } from 'lucide-react-native';

interface MobileSearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  style?: any;
  inputStyle?: any;
  placeholderTextColor?: string;
  iconColor?: string;
  clearIcon?: boolean;
  autoFocus?: boolean;
  textAlign?: 'left' | 'right' | 'center';
  debounceMs?: number;
}

export default function MobileSearchBar({
  placeholder,
  value,
  onChangeText,
  onClear,
  style,
  inputStyle,
  placeholderTextColor,
  iconColor = '#666',
  clearIcon = true,
  autoFocus = false,
  textAlign = 'right',
  debounceMs = 300
}: MobileSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<TextInput>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Delay focus to ensure component is fully mounted
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Prevent keyboard dismissal on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        // Only dismiss if the input is not focused
        if (!isFocused) {
          inputRef.current?.blur();
        }
      });

      return () => {
        keyboardDidHideListener?.remove();
      };
    }
  }, [isFocused]);

  // Prevent keyboard dismissal during active typing
  useEffect(() => {
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', (event) => {
      // If user is actively typing and keyboard is about to hide, prevent it
      if (isFocused && localValue.length > 0) {
        event.preventDefault?.();
      }
    });

    return () => {
      keyboardWillHideListener?.remove();
    };
  }, [isFocused, localValue.length]);

  // Prevent component re-rendering from causing focus loss
  useEffect(() => {
    if (isFocused && inputRef.current) {
      // Ensure focus is maintained even if parent component re-renders
      const currentInput = inputRef.current;
      const timer = setTimeout(() => {
        if (currentInput && isFocused) {
          currentInput.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isFocused, value]);

  // Debounced search to prevent excessive re-rendering
  const debouncedOnChangeText = useCallback((text: string) => {
    setLocalValue(text);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      onChangeText(text);
    }, debounceMs);
  }, [onChangeText, debounceMs]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClear = () => {
    setLocalValue('');
    onChangeText('');
    if (onClear) {
      onClear();
    }
    // Maintain focus after clearing
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    debouncedOnChangeText(text);
    // Ensure input maintains focus during text changes
    if (!isFocused) {
      inputRef.current?.focus();
    }
  };

  return (
    <View style={[
      styles.container,
      style,
      isFocused && styles.focused
    ]}>
      <Search size={20} color={iconColor} style={styles.searchIcon} />
      
      <TextInput
        ref={inputRef}
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor || '#999'}
        value={localValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        clearButtonMode="never"
        autoCorrect={false}
        autoCapitalize="none"
        // Mobile-specific props to prevent keyboard issues
        blurOnSubmit={false}
        keyboardType="default"
        textContentType="none"
        textAlign={textAlign}
        // Prevent keyboard dismissal on mobile
        autoComplete="off"
        autoCompleteType="off"
        // iOS specific props
        clearButtonMode="never"
        // Android specific props
        returnKeyLabel="search"
      />

      {clearIcon && localValue.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <X size={18} color={iconColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 5,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    // Mobile-specific optimizations
    minHeight: 44, // iOS minimum touch target
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  focused: {
    borderColor: '#007bff',
    borderWidth: 2,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
    color: '#333',
    // Mobile-specific text input optimizations
    minHeight: 28,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  clearButton: {
    padding: 8,
    marginLeft: 4,
    // Ensure minimum touch target
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
