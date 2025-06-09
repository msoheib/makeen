import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { MaintenanceStatus } from '@/lib/types';
import { ArrowLeft, PenTool as Tool, TriangleAlert as AlertTriangle, FileText, Building2 } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function AddMaintenanceRequestScreen() {
  const router = useRouter();
  const { property } = useLocalSearchParams();
  const user = useAppStore(state => state.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as MaintenanceStatus,
    property_id: property as string || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.property_id) {
      newErrors.property_id = 'Property selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a maintenance request');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        property_id: formData.property_id,
        tenant_id: user.id,
        images: [], // Empty array for now
      };

      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success',
        'Maintenance request submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/maintenance'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting maintenance request:', error);
      Alert.alert('Error', error.message || 'Failed to submit maintenance request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Maintenance Request</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Request Details */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Tool size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Request Details</Text>
          </View>

          <TextInput
            label="Title *"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            mode="outlined"
            style={styles.input}
            error={!!errors.title}
            placeholder="Brief description of the issue"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <TextInput
            label="Description *"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            error={!!errors.description}
            placeholder="Detailed description of the maintenance issue..."
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </ModernCard>

        {/* Priority Level */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={theme.colors.warning} />
            <Text style={styles.sectionTitle}>Priority Level</Text>
          </View>

          <SegmentedButtons
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
            buttons={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.priorityInfo}>
            {formData.priority === 'low' && (
              <Text style={styles.priorityDescription}>
                Non-urgent issues that can be addressed during regular maintenance.
              </Text>
            )}
            {formData.priority === 'medium' && (
              <Text style={styles.priorityDescription}>
                Standard maintenance issues that should be addressed within a few days.
              </Text>
            )}
            {formData.priority === 'high' && (
              <Text style={styles.priorityDescription}>
                Important issues that need attention within 24-48 hours.
              </Text>
            )}
            {formData.priority === 'urgent' && (
              <Text style={styles.priorityDescription}>
                Emergency issues requiring immediate attention (safety hazards, water leaks, etc.).
              </Text>
            )}
          </View>
        </ModernCard>

        {/* Property Selection */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color={theme.colors.secondary} />
            <Text style={styles.sectionTitle}>Property</Text>
          </View>

          <TextInput
            label="Property ID"
            value={formData.property_id}
            onChangeText={(text) => setFormData({ ...formData, property_id: text })}
            mode="outlined"
            style={styles.input}
            error={!!errors.property_id}
            placeholder="Enter property ID or select from list"
          />
          {errors.property_id && <Text style={styles.errorText}>{errors.property_id}</Text>}

          <Button
            mode="outlined"
            onPress={() => router.push('/properties/select')}
            style={styles.selectButton}
            icon="home-outline"
          >
            Select Property
          </Button>
        </ModernCard>

        {/* Status */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={theme.colors.tertiary} />
            <Text style={styles.sectionTitle}>Status</Text>
          </View>

          <SegmentedButtons
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as MaintenanceStatus })}
            buttons={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.statusInfo}>
            <Text style={styles.statusDescription}>
              New requests are automatically set to "Pending" status for review.
            </Text>
          </View>
        </ModernCard>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Submit Request
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingTop: spacing.xl,
    paddingBottom: spacing.s,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: spacing.s,
  },
  input: {
    marginBottom: spacing.m,
    backgroundColor: theme.colors.surface,
  },
  segmentedButtons: {
    marginBottom: spacing.m,
  },
  priorityInfo: {
    backgroundColor: theme.colors.warningContainer,
    padding: spacing.m,
    borderRadius: 8,
  },
  priorityDescription: {
    fontSize: 14,
    color: theme.colors.warning,
    lineHeight: 20,
  },
  statusInfo: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.m,
    borderRadius: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  selectButton: {
    borderColor: theme.colors.secondary,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -spacing.s,
    marginBottom: spacing.s,
  },
  submitContainer: {
    padding: spacing.m,
    paddingBottom: spacing.xxxl,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  submitButtonContent: {
    paddingVertical: spacing.s,
  },
});