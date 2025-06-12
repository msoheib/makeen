import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

interface PreferenceSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
  headerAction?: React.ReactNode;
}

export function PreferenceSection({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  icon,
  badge,
  headerAction,
}: PreferenceSectionProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity
        style={[
          styles.header,
          {
            borderBottomColor: expanded ? theme.colors.outline : 'transparent',
          },
        ]}
        onPress={handleToggle}
        disabled={!collapsible}
        activeOpacity={collapsible ? 0.7 : 1}
      >
        <View style={styles.headerContent}>
          {icon && (
            <View style={[styles.headerIcon, { opacity: 0.8 }]}>
              {icon}
            </View>
          )}
          
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.onSurface,
                  },
                ]}
              >
                {title}
              </Text>
              
              {badge && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: theme.colors.primaryContainer,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: theme.colors.onPrimaryContainer,
                      },
                    ]}
                  >
                    {badge}
                  </Text>
                </View>
              )}
            </View>
            
            {description && (
              <Text
                style={[
                  styles.description,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {description}
              </Text>
            )}
          </View>

          <View style={styles.headerRight}>
            {headerAction && (
              <View style={styles.headerAction}>
                {headerAction}
              </View>
            )}
            
            {collapsible && (
              <Feather
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.onSurfaceVariant}
                style={styles.chevron}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginRight: 8,
  },
  chevron: {
    marginLeft: 4,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
}); 