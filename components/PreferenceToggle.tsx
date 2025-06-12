import React from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../lib/theme';

interface PreferenceToggleProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function PreferenceToggle({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  icon,
  rightContent,
}: PreferenceToggleProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.content}>
        {icon && (
          <View style={[styles.iconContainer, { opacity: disabled ? 0.5 : 1 }]}>
            {icon}
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              {
                color: disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface,
              },
            ]}
          >
            {title}
          </Text>
          
          {description && (
            <Text
              style={[
                styles.description,
                {
                  color: disabled
                    ? theme.colors.onSurfaceDisabled
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {description}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {rightContent && (
            <View style={styles.rightContent}>
              {rightContent}
            </View>
          )}
          
          <Switch
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
            trackColor={{
              false: theme.colors.surfaceVariant,
              true: theme.colors.primary,
            }}
            thumbColor={
              Platform.OS === 'android'
                ? value
                  ? theme.colors.onPrimary
                  : theme.colors.onSurfaceVariant
                : undefined
            }
            ios_backgroundColor={theme.colors.surfaceVariant}
            style={[
              styles.switch,
              {
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 56,
  },
  iconContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContent: {
    marginRight: 12,
  },
  switch: {
    transform: Platform.OS === 'ios' ? [{ scaleX: 0.9 }, { scaleY: 0.9 }] : [],
  },
}); 