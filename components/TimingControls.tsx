import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../lib/theme';
import { TimingConfig } from '../types/notificationPreferences';

interface TimingControlsProps {
  timing: TimingConfig;
  onTimingChange: (updates: Partial<TimingConfig>) => void;
}

export function TimingControls({ timing, onTimingChange }: TimingControlsProps) {
  const { theme } = useTheme();
  const [showTimePicker, setShowTimePicker] = useState<{
    type: 'quietStart' | 'quietEnd' | 'businessStart' | 'businessEnd' | null;
    value: Date;
  } | null>(null);

  const parseTimeString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTimeString = (date: Date): string => {
    return date.toTimeString().slice(0, 5); // HH:MM format
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(null);
    }

    if (selectedDate && showTimePicker) {
      const timeString = formatTimeString(selectedDate);
      
      switch (showTimePicker.type) {
        case 'quietStart':
          onTimingChange({
            quietHours: {
              ...timing.quietHours,
              startTime: timeString,
            },
          });
          break;
        case 'quietEnd':
          onTimingChange({
            quietHours: {
              ...timing.quietHours,
              endTime: timeString,
            },
          });
          break;
        case 'businessStart':
          onTimingChange({
            businessHoursOnly: {
              ...timing.businessHoursOnly,
              startTime: timeString,
            },
          });
          break;
        case 'businessEnd':
          onTimingChange({
            businessHoursOnly: {
              ...timing.businessHoursOnly,
              endTime: timeString,
            },
          });
          break;
      }
    }

    if (Platform.OS === 'ios') {
      // On iOS, keep the picker open until manually closed
    }
  };

  const showTimePickerModal = (
    type: 'quietStart' | 'quietEnd' | 'businessStart' | 'businessEnd',
    currentTime: string
  ) => {
    setShowTimePicker({
      type,
      value: parseTimeString(currentTime),
    });
  };

  const toggleDoNotDisturb = () => {
    if (timing.doNotDisturb.enabled) {
      // Disable DND
      onTimingChange({
        doNotDisturb: {
          enabled: false,
          endTime: undefined,
        },
      });
    } else {
      // Enable DND with options
      Alert.alert(
        'Do Not Disturb',
        'How long would you like to enable Do Not Disturb?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: '1 Hour',
            onPress: () => {
              const endTime = new Date();
              endTime.setHours(endTime.getHours() + 1);
              onTimingChange({
                doNotDisturb: {
                  enabled: true,
                  endTime: endTime.toISOString(),
                },
              });
            },
          },
          {
            text: '4 Hours',
            onPress: () => {
              const endTime = new Date();
              endTime.setHours(endTime.getHours() + 4);
              onTimingChange({
                doNotDisturb: {
                  enabled: true,
                  endTime: endTime.toISOString(),
                },
              });
            },
          },
          {
            text: 'Until Tomorrow',
            onPress: () => {
              const endTime = new Date();
              endTime.setDate(endTime.getDate() + 1);
              endTime.setHours(8, 0, 0, 0); // 8 AM tomorrow
              onTimingChange({
                doNotDisturb: {
                  enabled: true,
                  endTime: endTime.toISOString(),
                },
              });
            },
          },
        ]
      );
    }
  };

  const getDndTimeRemaining = (): string => {
    if (!timing.doNotDisturb.enabled || !timing.doNotDisturb.endTime) {
      return '';
    }

    const now = new Date();
    const endTime = new Date(timing.doNotDisturb.endTime);
    const diffMs = endTime.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'Expired';
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Quiet Hours */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerLeft}>
            <Feather
              name="moon"
              size={20}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Quiet Hours
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.toggle,
              {
                backgroundColor: timing.quietHours.enabled
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
              },
            ]}
            onPress={() =>
              onTimingChange({
                quietHours: {
                  ...timing.quietHours,
                  enabled: !timing.quietHours.enabled,
                },
              })
            }
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: timing.quietHours.enabled
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant,
                  transform: [
                    { translateX: timing.quietHours.enabled ? 16 : 2 },
                  ],
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
          Silence notifications during specified hours
        </Text>

        {timing.quietHours.enabled && (
          <View style={styles.timeControls}>
            <TouchableOpacity
              style={[styles.timeButton, { borderColor: theme.colors.outline }]}
              onPress={() => showTimePickerModal('quietStart', timing.quietHours.startTime)}
            >
              <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>
                From
              </Text>
              <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>
                {timing.quietHours.startTime}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.timeSeparator, { color: theme.colors.onSurfaceVariant }]}>
              to
            </Text>

            <TouchableOpacity
              style={[styles.timeButton, { borderColor: theme.colors.outline }]}
              onPress={() => showTimePickerModal('quietEnd', timing.quietHours.endTime)}
            >
              <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>
                Until
              </Text>
              <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>
                {timing.quietHours.endTime}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Do Not Disturb */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity style={styles.sectionHeader} onPress={toggleDoNotDisturb}>
          <View style={styles.headerLeft}>
            <Feather
              name="minus-circle"
              size={20}
              color={timing.doNotDisturb.enabled ? theme.colors.error : theme.colors.primary}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Do Not Disturb
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {timing.doNotDisturb.enabled && (
              <Text style={[styles.dndTime, { color: theme.colors.error }]}>
                {getDndTimeRemaining()}
              </Text>
            )}
            <Feather
              name="chevron-right"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
          {timing.doNotDisturb.enabled
            ? 'All notifications are silenced'
            : 'Temporarily silence all notifications'
          }
        </Text>
      </View>

      {/* Business Hours Only */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerLeft}>
            <Feather
              name="briefcase"
              size={20}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Business Hours Only
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.toggle,
              {
                backgroundColor: timing.businessHoursOnly.enabled
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
              },
            ]}
            onPress={() =>
              onTimingChange({
                businessHoursOnly: {
                  ...timing.businessHoursOnly,
                  enabled: !timing.businessHoursOnly.enabled,
                },
              })
            }
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: timing.businessHoursOnly.enabled
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant,
                  transform: [
                    { translateX: timing.businessHoursOnly.enabled ? 16 : 2 },
                  ],
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
          Only receive notifications during business hours
        </Text>

        {timing.businessHoursOnly.enabled && (
          <View>
            <View style={styles.timeControls}>
              <TouchableOpacity
                style={[styles.timeButton, { borderColor: theme.colors.outline }]}
                onPress={() => showTimePickerModal('businessStart', timing.businessHoursOnly.startTime)}
              >
                <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>
                  From
                </Text>
                <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>
                  {timing.businessHoursOnly.startTime}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.timeSeparator, { color: theme.colors.onSurfaceVariant }]}>
                to
              </Text>

              <TouchableOpacity
                style={[styles.timeButton, { borderColor: theme.colors.outline }]}
                onPress={() => showTimePickerModal('businessEnd', timing.businessHoursOnly.endTime)}
              >
                <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Until
                </Text>
                <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>
                  {timing.businessHoursOnly.endTime}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.weekdayToggle,
                {
                  backgroundColor: timing.businessHoursOnly.weekdaysOnly
                    ? theme.colors.primaryContainer
                    : theme.colors.surfaceVariant,
                },
              ]}
              onPress={() =>
                onTimingChange({
                  businessHoursOnly: {
                    ...timing.businessHoursOnly,
                    weekdaysOnly: !timing.businessHoursOnly.weekdaysOnly,
                  },
                })
              }
            >
              <Text
                style={[
                  styles.weekdayText,
                  {
                    color: timing.businessHoursOnly.weekdaysOnly
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                Weekdays only (Mon-Fri)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={showTimePicker.value}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          style={Platform.OS === 'ios' ? styles.iosTimePicker : undefined}
        />
      )}

      {Platform.OS === 'ios' && showTimePicker && (
        <View style={styles.iosPickerOverlay}>
          <View style={[styles.iosPickerContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity
                onPress={() => setShowTimePicker(null)}
                style={styles.iosPickerButton}
              >
                <Text style={[styles.iosPickerButtonText, { color: theme.colors.primary }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={showTimePicker.value}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimeChange}
              style={styles.iosTimePicker}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    position: 'relative',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: 2,
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeSeparator: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  dndTime: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  weekdayToggle: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  iosPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34, // Safe area
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  iosPickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iosPickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iosTimePicker: {
    height: 200,
  },
}); 