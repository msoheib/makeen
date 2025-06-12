import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Button, Portal, Modal, RadioButton, TextInput, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

interface StatusUpdateModalProps {
  visible: boolean;
  onDismiss: () => void;
  onUpdate: (status: string, notes?: string, actualCost?: number) => void;
  currentStatus: string;
  itemType: 'maintenance_request' | 'work_order';
  title: string;
  loading?: boolean;
}

const MAINTENANCE_REQUEST_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#F57C00', icon: 'schedule' },
  { value: 'approved', label: 'Approved', color: '#1976D2', icon: 'check-circle' },
  { value: 'in_progress', label: 'In Progress', color: '#7B1FA2', icon: 'build' },
  { value: 'completed', label: 'Completed', color: '#388E3C', icon: 'done-all' },
  { value: 'cancelled', label: 'Cancelled', color: '#D32F2F', icon: 'cancel' },
];

const WORK_ORDER_STATUSES = [
  { value: 'assigned', label: 'Assigned', color: '#1976D2', icon: 'assignment' },
  { value: 'in_progress', label: 'In Progress', color: '#F57C00', icon: 'build' },
  { value: 'completed', label: 'Completed', color: '#388E3C', icon: 'done-all' },
  { value: 'cancelled', label: 'Cancelled', color: '#D32F2F', icon: 'cancel' },
];

const STATUS_TRANSITIONS = {
  maintenance_request: {
    pending: ['approved', 'cancelled'],
    approved: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  },
  work_order: {
    assigned: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  },
};

export default function StatusUpdateModal({
  visible,
  onDismiss,
  onUpdate,
  currentStatus,
  itemType,
  title,
  loading = false,
}: StatusUpdateModalProps) {
  const { theme } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [actualCost, setActualCost] = useState('');

  const statusOptions = itemType === 'maintenance_request' 
    ? MAINTENANCE_REQUEST_STATUSES 
    : WORK_ORDER_STATUSES;

  const allowedTransitions = STATUS_TRANSITIONS[itemType][currentStatus] || [];

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status);
  };

  const getCurrentStatusInfo = () => getStatusInfo(currentStatus);
  const getSelectedStatusInfo = () => getStatusInfo(selectedStatus);

  const isValidTransition = (newStatus: string) => {
    return newStatus === currentStatus || allowedTransitions.includes(newStatus);
  };

  const handleUpdate = () => {
    if (selectedStatus === currentStatus) {
      Alert.alert('No Changes', 'Status has not changed.');
      return;
    }

    if (!isValidTransition(selectedStatus)) {
      Alert.alert('Invalid Transition', 'This status change is not allowed.');
      return;
    }

    const updateData: any = { status: selectedStatus };
    if (notes.trim()) updateData.notes = notes.trim();
    if (actualCost && itemType === 'work_order' && selectedStatus === 'completed') {
      const cost = parseFloat(actualCost);
      if (isNaN(cost) || cost < 0) {
        Alert.alert('Invalid Cost', 'Please enter a valid cost amount.');
        return;
      }
      updateData.actualCost = cost;
    }

    onUpdate(selectedStatus, notes.trim() || undefined, actualCost ? parseFloat(actualCost) : undefined);
  };

  const resetForm = () => {
    setSelectedStatus(currentStatus);
    setNotes('');
    setActualCost('');
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          resetForm();
          onDismiss();
        }}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <ScrollView>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Update Status
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {title}
            </Text>
          </View>

          {/* Current Status */}
          <View style={styles.currentStatusSection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
              Current Status
            </Text>
            <View style={styles.statusDisplay}>
              <MaterialIcons 
                name={getCurrentStatusInfo()?.icon as any} 
                size={20} 
                color={getCurrentStatusInfo()?.color} 
              />
              <Chip
                mode="flat"
                textStyle={{ color: 'white', fontWeight: '600' }}
                style={{ backgroundColor: getCurrentStatusInfo()?.color }}
              >
                {getCurrentStatusInfo()?.label}
              </Chip>
            </View>
          </View>

          {/* New Status Selection */}
          <View style={styles.statusSelection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
              Select New Status
            </Text>
            <RadioButton.Group onValueChange={setSelectedStatus} value={selectedStatus}>
              {statusOptions.map((status) => {
                const isAllowed = isValidTransition(status.value);
                const isCurrent = status.value === currentStatus;
                
                return (
                  <View
                    key={status.value}
                    style={[
                      styles.statusOption,
                      {
                        backgroundColor: isAllowed 
                          ? theme.colors.surface 
                          : theme.colors.surfaceVariant,
                        borderColor: selectedStatus === status.value 
                          ? status.color 
                          : theme.colors.outline,
                        opacity: isAllowed ? 1 : 0.5,
                      },
                    ]}
                  >
                    <RadioButton
                      value={status.value}
                      disabled={!isAllowed}
                      color={status.color}
                    />
                    <MaterialIcons 
                      name={status.icon as any} 
                      size={20} 
                      color={isAllowed ? status.color : theme.colors.onSurfaceVariant} 
                    />
                    <View style={styles.statusDetails}>
                      <Text
                        style={[
                          styles.statusLabel,
                          { 
                            color: isAllowed 
                              ? theme.colors.onSurface 
                              : theme.colors.onSurfaceVariant 
                          },
                        ]}
                      >
                        {status.label}
                      </Text>
                      {isCurrent && (
                        <Text style={[styles.currentLabel, { color: status.color }]}>
                          Current
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </RadioButton.Group>
          </View>

          {/* Cost Input for Work Order Completion */}
          {itemType === 'work_order' && selectedStatus === 'completed' && (
            <View style={styles.costSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Actual Cost (SAR)
              </Text>
              <TextInput
                mode="outlined"
                placeholder="Enter actual cost..."
                value={actualCost}
                onChangeText={setActualCost}
                keyboardType="numeric"
                style={styles.costInput}
                left={<TextInput.Icon icon="currency-usd" />}
              />
            </View>
          )}

          {/* Notes */}
          <View style={styles.notesSection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
              Notes (Optional)
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Add notes about this status change..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
          </View>

          {/* Status Change Preview */}
          {selectedStatus !== currentStatus && (
            <View style={[styles.previewSection, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.previewLabel, { color: theme.colors.onSurfaceVariant }]}>
                Status Change Preview
              </Text>
              <View style={styles.previewFlow}>
                <Chip
                  mode="flat"
                  textStyle={{ color: 'white', fontWeight: '600', fontSize: 12 }}
                  style={{ backgroundColor: getCurrentStatusInfo()?.color }}
                >
                  {getCurrentStatusInfo()?.label}
                </Chip>
                <MaterialIcons name="arrow-forward" size={20} color={theme.colors.onSurfaceVariant} />
                <Chip
                  mode="flat"
                  textStyle={{ color: 'white', fontWeight: '600', fontSize: 12 }}
                  style={{ backgroundColor: getSelectedStatusInfo()?.color }}
                >
                  {getSelectedStatusInfo()?.label}
                </Chip>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => {
                resetForm();
                onDismiss();
              }}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdate}
              style={styles.updateButton}
              disabled={loading || selectedStatus === currentStatus}
              loading={loading}
            >
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  currentStatusSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusSelection: {
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 8,
    gap: 12,
  },
  statusDetails: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  currentLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  costSection: {
    marginBottom: 20,
  },
  costInput: {
    backgroundColor: 'transparent',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: 'transparent',
  },
  previewSection: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  previewFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  updateButton: {
    flex: 2,
  },
}); 