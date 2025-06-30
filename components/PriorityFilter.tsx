import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { NotificationPriority } from '../types/notificationPreferences';
import { PRIORITY_INFO } from '../types/notificationPreferences';

interface PriorityFilterProps {
  minimumPriority: NotificationPriority;
  urgentOverride: boolean;
  onMinimumPriorityChange: (priority: NotificationPriority) => void;
  onUrgentOverrideChange: (enabled: boolean) => void;
}

const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent'] as const;

export function PriorityFilter({
  minimumPriority,
  urgentOverride,
  onMinimumPriorityChange,
  onUrgentOverrideChange,
}: PriorityFilterProps) {
  const { theme } = useTheme();

  const getPriorityIcon = (priority: NotificationPriority): string => {
    switch (priority) {
      case 'low':
        return 'info';
      case 'medium':
        return 'alert-circle';
      case 'high':
        return 'alert-triangle';
      case 'urgent':
        return 'alert-octagon';
    }
  };

  const isPrioritySelected = (priority: NotificationPriority): boolean => {
    const priorityLevels = { low: 1, medium: 2, high: 3, urgent: 4 };
    return priorityLevels[priority] >= priorityLevels[minimumPriority];
  };

  const getPriorityCount = (): number => {
    const priorityLevels = { low: 1, medium: 2, high: 3, urgent: 4 };
    return PRIORITY_LEVELS.filter(p => priorityLevels[p] >= priorityLevels[minimumPriority]).length;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Priority Filter
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {getPriorityCount()} of 4 priorities enabled
        </Text>
      </View>

      {/* Minimum Priority Selection */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Minimum Priority Level
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
          Only show notifications at or above this priority level
        </Text>

        <View style={styles.priorityGrid}>
          {PRIORITY_LEVELS.map((priority) => {
            const isSelected = isPrioritySelected(priority);
            const isMinimum = priority === minimumPriority;
            const priorityInfo = PRIORITY_INFO[priority];

            return (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityOption,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                    borderColor: isMinimum ? theme.colors.primary : 'transparent',
                    borderWidth: isMinimum ? 2 : 0,
                  },
                ]}
                onPress={() => onMinimumPriorityChange(priority)}
                activeOpacity={0.7}
              >
                <View style={styles.priorityHeader}>
                  <Feather
                    name={getPriorityIcon(priority)}
                    size={20}
                    color={isSelected ? priorityInfo.color : theme.colors.onSurfaceVariant}
                  />
                  {isMinimum && (
                    <View
                      style={[
                        styles.minimumBadge,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.minimumBadgeText,
                          { color: theme.colors.onPrimary },
                        ]}
                      >
                        Min
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.priorityTitle,
                    {
                      color: isSelected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                      fontWeight: isSelected ? '600' : '500',
                    },
                  ]}
                >
                  {priorityInfo.title}
                </Text>

                <Text
                  style={[
                    styles.priorityDescription,
                    {
                      color: isSelected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                      opacity: isSelected ? 0.8 : 0.6,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {priorityInfo.description}
                </Text>

                {/* Visual indicator for enabled state */}
                <View style={styles.priorityIndicator}>
                  <View
                    style={[
                      styles.priorityDot,
                      {
                        backgroundColor: isSelected ? priorityInfo.color : theme.colors.outline,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.priorityState,
                      {
                        color: isSelected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                        fontSize: 12,
                      },
                    ]}
                  >
                    {isSelected ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Urgent Override */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.overrideHeader}>
          <View style={styles.overrideContent}>
            <View style={styles.overrideIcon}>
              <Feather
                name="alert-octagon"
                size={20}
                color={urgentOverride ? theme.colors.error : theme.colors.onSurfaceVariant}
              />
            </View>
            <View style={styles.overrideText}>
              <Text style={[styles.overrideTitle, { color: theme.colors.onSurface }]}>
                Urgent Override
              </Text>
              <Text style={[styles.overrideDescription, { color: theme.colors.onSurfaceVariant }]}>
                Always show urgent notifications regardless of other settings
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.overrideToggle,
              {
                backgroundColor: urgentOverride
                  ? theme.colors.error
                  : theme.colors.surfaceVariant,
              },
            ]}
            onPress={() => onUrgentOverrideChange(!urgentOverride)}
          >
            <View
              style={[
                styles.overrideToggleThumb,
                {
                  backgroundColor: urgentOverride
                    ? theme.colors.onError
                    : theme.colors.onSurfaceVariant,
                  transform: [{ translateX: urgentOverride ? 16 : 2 }],
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        {urgentOverride && (
          <View
            style={[
              styles.overrideNote,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Feather
              name="info"
              size={16}
              color={theme.colors.onErrorContainer}
              style={styles.overrideNoteIcon}
            />
            <Text
              style={[
                styles.overrideNoteText,
                { color: theme.colors.onErrorContainer },
              ]}
            >
              Urgent notifications will bypass all timing and delivery filters
            </Text>
          </View>
        )}
      </View>

      {/* Priority Preview */}
      <View style={[styles.preview, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text style={[styles.previewTitle, { color: theme.colors.onSurfaceVariant }]}>
          Current Filter Summary
        </Text>
        <Text style={[styles.previewText, { color: theme.colors.onSurface }]}>
          Showing {minimumPriority}+ priority notifications
          {urgentOverride ? ' (urgent always shown)' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    minHeight: 120,
    position: 'relative',
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  minimumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  minimumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priorityTitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  priorityDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  priorityState: {
    fontWeight: '500',
  },
  overrideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overrideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  overrideIcon: {
    marginRight: 12,
  },
  overrideText: {
    flex: 1,
  },
  overrideTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  overrideDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  overrideToggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    position: 'relative',
  },
  overrideToggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: 2,
  },
  overrideNote: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overrideNoteIcon: {
    marginRight: 8,
  },
  overrideNoteText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  preview: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 