import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { notificationPreferences } from '../../lib/notificationPreferences';
import {
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
  DeliveryMethod,
  NOTIFICATION_CATEGORY_INFO,
} from '../../types/notificationPreferences';
import { PreferenceToggle } from '../../components/PreferenceToggle';
import { PreferenceSection } from '../../components/PreferenceSection';
import { TimingControls } from '../../components/TimingControls';
import { PriorityFilter } from '../../components/PriorityFilter';
import { ModernHeader } from '../../components/ModernHeader';

type PreferenceTab = 'categories' | 'delivery' | 'timing' | 'priority' | 'advanced';

export default function NotificationPreferencesScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const initialTab = (params.tab as PreferenceTab) || 'categories';

  const [activeTab, setActiveTab] = useState<PreferenceTab>(initialTab);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await notificationPreferences.load();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    try {
      setSaving(true);
      const updatedPrefs = { ...preferences, ...updates };
      await notificationPreferences.save(updatedPrefs);
      setPreferences(updatedPrefs);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalToggle = async (enabled: boolean) => {
    await savePreferences({ globalEnabled: enabled });
  };

  const handleCategoryToggle = async (category: NotificationType, enabled: boolean) => {
    if (!preferences) return;
    
    const updatedCategories = {
      ...preferences.categories,
      [category]: {
        ...preferences.categories[category],
        enabled,
      },
    };
    
    await savePreferences({ categories: updatedCategories });
  };

  const handleCategoryDeliveryMethods = async (
    category: NotificationType,
    methods: DeliveryMethod[]
  ) => {
    if (!preferences) return;
    
    const updatedCategories = {
      ...preferences.categories,
      [category]: {
        ...preferences.categories[category],
        deliveryMethods: methods,
      },
    };
    
    await savePreferences({ categories: updatedCategories });
  };

  const handleCategoryPriority = async (
    category: NotificationType,
    priority: NotificationPriority
  ) => {
    if (!preferences) return;
    
    const updatedCategories = {
      ...preferences.categories,
      [category]: {
        ...preferences.categories[category],
        minimumPriority: priority,
      },
    };
    
    await savePreferences({ categories: updatedCategories });
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all notification preferences to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await notificationPreferences.reset();
              await loadPreferences();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset preferences');
            }
          },
        },
      ]
    );
  };

  const tabs = [
    { id: 'categories', title: 'Categories', icon: 'grid' },
    { id: 'delivery', title: 'Delivery', icon: 'send' },
    { id: 'timing', title: 'Timing', icon: 'clock' },
    { id: 'priority', title: 'Priority', icon: 'alert-triangle' },
    { id: 'advanced', title: 'Advanced', icon: 'settings' },
  ] as const;

  const getEnabledCategoriesCount = (): number => {
    if (!preferences) return 0;
    return Object.values(preferences.categories).filter(cat => cat.enabled).length;
  };

  const renderTabContent = () => {
    if (!preferences) return null;

    switch (activeTab) {
      case 'categories':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <PreferenceSection
              title="Notification Categories"
              description={`${getEnabledCategoriesCount()} of ${Object.keys(preferences.categories).length} categories enabled`}
              icon={<Feather name="grid" size={20} color={theme.colors.primary} />}
            >
              {Object.entries(NOTIFICATION_CATEGORY_INFO).map(([category, info]) => {
                const categoryPrefs = preferences.categories[category];
                if (!categoryPrefs) return null;

                return (
                  <View key={category} style={styles.categoryItem}>
                    <PreferenceToggle
                      title={info.title}
                      description={info.description}
                      value={categoryPrefs.enabled}
                      onValueChange={(enabled) => handleCategoryToggle(category as NotificationType, enabled)}
                      icon={<Feather name={info.icon} size={20} color={theme.colors.primary} />}
                    />
                    
                    {categoryPrefs.enabled && (
                      <View style={styles.categoryDetails}>
                        <Text style={[styles.detailsTitle, { color: theme.colors.onSurfaceVariant }]}>
                          Delivery Methods
                        </Text>
                        <View style={styles.deliveryMethods}>
                          {(['push', 'inApp', 'email'] as DeliveryMethod[]).map((method) => (
                            <TouchableOpacity
                              key={method}
                              style={[
                                styles.methodChip,
                                {
                                  backgroundColor: categoryPrefs.deliveryMethods.includes(method)
                                    ? theme.colors.primaryContainer
                                    : theme.colors.surfaceVariant,
                                },
                              ]}
                              onPress={() => {
                                const methods = categoryPrefs.deliveryMethods.includes(method)
                                  ? categoryPrefs.deliveryMethods.filter(m => m !== method)
                                  : [...categoryPrefs.deliveryMethods, method];
                                handleCategoryDeliveryMethods(category as NotificationType, methods);
                              }}
                            >
                              <Text
                                style={[
                                  styles.methodText,
                                  {
                                    color: categoryPrefs.deliveryMethods.includes(method)
                                      ? theme.colors.onPrimaryContainer
                                      : theme.colors.onSurfaceVariant,
                                  },
                                ]}
                              >
                                {method === 'inApp' ? 'In-App' : method.charAt(0).toUpperCase() + method.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </PreferenceSection>
          </ScrollView>
        );

      case 'delivery':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <PreferenceSection
              title="Push Notifications"
              description="Configure push notification settings"
              icon={<Feather name="smartphone" size={20} color={theme.colors.primary} />}
            >
              <PreferenceToggle
                title="Enable Push Notifications"
                description="Receive notifications on your device"
                value={preferences.deliveryMethods.push.enabled}
                onValueChange={(enabled) =>
                  savePreferences({
                    deliveryMethods: {
                      ...preferences.deliveryMethods,
                      push: { ...preferences.deliveryMethods.push, enabled },
                    },
                  })
                }
              />
              
              {preferences.deliveryMethods.push.enabled && (
                <>
                  <PreferenceToggle
                    title="Sound"
                    description="Play sound for notifications"
                    value={preferences.deliveryMethods.push.sound}
                    onValueChange={(sound) =>
                      savePreferences({
                        deliveryMethods: {
                          ...preferences.deliveryMethods,
                          push: { ...preferences.deliveryMethods.push, sound },
                        },
                      })
                    }
                  />
                  
                  <PreferenceToggle
                    title="Vibration"
                    description="Vibrate for notifications"
                    value={preferences.deliveryMethods.push.vibration}
                    onValueChange={(vibration) =>
                      savePreferences({
                        deliveryMethods: {
                          ...preferences.deliveryMethods,
                          push: { ...preferences.deliveryMethods.push, vibration },
                        },
                      })
                    }
                  />
                  
                  <PreferenceToggle
                    title="Badge Count"
                    description="Show unread count on app icon"
                    value={preferences.deliveryMethods.push.badge}
                    onValueChange={(badge) =>
                      savePreferences({
                        deliveryMethods: {
                          ...preferences.deliveryMethods,
                          push: { ...preferences.deliveryMethods.push, badge },
                        },
                      })
                    }
                  />
                </>
              )}
            </PreferenceSection>

            <PreferenceSection
              title="In-App Notifications"
              description="Configure in-app notification settings"
              icon={<Feather name="bell" size={20} color={theme.colors.primary} />}
            >
              <PreferenceToggle
                title="Enable In-App Notifications"
                description="Show notifications within the app"
                value={preferences.deliveryMethods.inApp.enabled}
                onValueChange={(enabled) =>
                  savePreferences({
                    deliveryMethods: {
                      ...preferences.deliveryMethods,
                      inApp: { ...preferences.deliveryMethods.inApp, enabled },
                    },
                  })
                }
              />
              
              {preferences.deliveryMethods.inApp.enabled && (
                <PreferenceToggle
                  title="Show Unread Count"
                  description="Display unread notification count"
                  value={preferences.deliveryMethods.inApp.showUnreadCount}
                  onValueChange={(showUnreadCount) =>
                    savePreferences({
                      deliveryMethods: {
                        ...preferences.deliveryMethods,
                        inApp: { ...preferences.deliveryMethods.inApp, showUnreadCount },
                      },
                    })
                  }
                />
              )}
            </PreferenceSection>

            <PreferenceSection
              title="Email Notifications"
              description="Configure email notification settings"
              icon={<Feather name="mail" size={20} color={theme.colors.primary} />}
            >
              <PreferenceToggle
                title="Enable Email Notifications"
                description="Receive notifications via email"
                value={preferences.deliveryMethods.email.enabled}
                onValueChange={(enabled) =>
                  savePreferences({
                    deliveryMethods: {
                      ...preferences.deliveryMethods,
                      email: { ...preferences.deliveryMethods.email, enabled },
                    },
                  })
                }
              />
              
              {preferences.deliveryMethods.email.enabled && (
                <PreferenceToggle
                  title="Daily Digest"
                  description="Send summary instead of individual emails"
                  value={preferences.deliveryMethods.email.digest}
                  onValueChange={(digest) =>
                    savePreferences({
                      deliveryMethods: {
                        ...preferences.deliveryMethods,
                        email: { ...preferences.deliveryMethods.email, digest },
                      },
                    })
                  }
                />
              )}
            </PreferenceSection>
          </ScrollView>
        );

      case 'timing':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <TimingControls
              timing={preferences.timing}
              onTimingChange={(updates) =>
                savePreferences({
                  timing: { ...preferences.timing, ...updates },
                })
              }
            />
          </ScrollView>
        );

      case 'priority':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <PriorityFilter
              minimumPriority={preferences.priorityFilter.minimumPriority}
              urgentOverride={preferences.priorityFilter.urgentOverride}
              onMinimumPriorityChange={(priority) =>
                savePreferences({
                  priorityFilter: {
                    ...preferences.priorityFilter,
                    minimumPriority: priority,
                  },
                })
              }
              onUrgentOverrideChange={(urgentOverride) =>
                savePreferences({
                  priorityFilter: {
                    ...preferences.priorityFilter,
                    urgentOverride,
                  },
                })
              }
            />
          </ScrollView>
        );

      case 'advanced':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <PreferenceSection
              title="Behavior Settings"
              description="Advanced notification behavior"
              icon={<Feather name="sliders" size={20} color={theme.colors.primary} />}
            >
              <PreferenceToggle
                title="Group Similar Notifications"
                description="Combine notifications of the same type"
                value={preferences.advanced.groupSimilar}
                onValueChange={(groupSimilar) =>
                  savePreferences({
                    advanced: { ...preferences.advanced, groupSimilar },
                  })
                }
              />
              
              <PreferenceToggle
                title="Auto-mark as Read"
                description="Automatically mark notifications as read when viewed"
                value={preferences.advanced.autoMarkRead}
                onValueChange={(autoMarkRead) =>
                  savePreferences({
                    advanced: { ...preferences.advanced, autoMarkRead },
                  })
                }
              />
            </PreferenceSection>

            <PreferenceSection
              title="Storage Settings"
              description="Manage notification storage and cleanup"
              icon={<Feather name="database" size={20} color={theme.colors.primary} />}
            >
              <View style={styles.advancedItem}>
                <Text style={[styles.advancedLabel, { color: theme.colors.onSurface }]}>
                  Retention Period
                </Text>
                <Text style={[styles.advancedValue, { color: theme.colors.onSurfaceVariant }]}>
                  {preferences.advanced.retentionDays} days
                </Text>
              </View>
              
              <View style={styles.advancedItem}>
                <Text style={[styles.advancedLabel, { color: theme.colors.onSurface }]}>
                  Maximum Notifications
                </Text>
                <Text style={[styles.advancedValue, { color: theme.colors.onSurfaceVariant }]}>
                  {preferences.advanced.maxNotifications}
                </Text>
              </View>
            </PreferenceSection>

            <PreferenceSection
              title="Reset & Backup"
              description="Manage preference settings"
              icon={<Feather name="refresh-cw" size={20} color={theme.colors.error} />}
            >
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: theme.colors.errorContainer }]}
                onPress={handleResetToDefaults}
                disabled={saving}
              >
                <Feather
                  name="refresh-cw"
                  size={20}
                  color={theme.colors.onErrorContainer}
                />
                <Text style={[styles.resetText, { color: theme.colors.onErrorContainer }]}>
                  Reset to Defaults
                </Text>
              </TouchableOpacity>
            </PreferenceSection>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader
          title="Notification Preferences"
          onBackPress={() => router.back()}
          showBackButton
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading preferences...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader
        title="Notification Preferences"
        onBackPress={() => router.back()}
        showBackButton
        rightContent={
          preferences && (
            <PreferenceToggle
              title=""
              value={preferences.globalEnabled}
              onValueChange={handleGlobalToggle}
            />
          )
        }
      />

      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab.id
                    ? theme.colors.primaryContainer
                    : 'transparent',
                },
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Feather
                name={tab.icon}
                size={16}
                color={
                  activeTab === tab.id
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab.id
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant,
                    fontWeight: activeTab === tab.id ? '600' : '500',
                  },
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Saving Indicator */}
      {saving && (
        <View style={[styles.savingOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.savingCard, { backgroundColor: theme.colors.surface }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.savingText, { color: theme.colors.onSurface }]}>
              Saving preferences...
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryDetails: {
    marginTop: 12,
    marginLeft: 40,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  deliveryMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '500',
  },
  advancedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  advancedLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  advancedValue: {
    fontSize: 14,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  resetText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  savingText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
}); 