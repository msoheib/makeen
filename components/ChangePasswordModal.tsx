import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  Button, 
  Portal, 
  Modal, 
  TextInput, 
  Text, 
  useTheme,
  HelperText 
} from 'react-native-paper';
import { Shield, Eye, EyeOff } from 'lucide-react-native';

interface ChangePasswordModalProps {
  visible: boolean;
  onDismiss: () => void;
  onChangePassword: (newPassword: string) => Promise<void>;
  loading?: boolean;
}

export default function ChangePasswordModal({
  visible,
  onDismiss,
  onChangePassword,
  loading = false,
}: ChangePasswordModalProps) {
  const { t } = useTranslation(['common', 'settings']);
  const theme = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: theme.colors.onSurfaceVariant };
    if (password.length < 6) return { strength: 1, label: 'Too short', color: theme.colors.error };
    if (password.length < 8) return { strength: 2, label: 'Weak', color: '#FF9800' };
    if (password.length < 12) return { strength: 3, label: 'Good', color: '#4CAF50' };
    return { strength: 4, label: 'Strong', color: '#2E7D32' };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  const isValidPassword = newPassword.length >= 6 && passwordsMatch;

  const handleSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Don\'t Match', 'Please make sure both passwords are the same');
      return;
    }

    try {
      await onChangePassword(newPassword);
      resetForm();
      onDismiss();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleDismiss = () => {
    if (!loading) {
      resetForm();
      onDismiss();
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
        dismissable={!loading}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Shield size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Change Password
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Create a new password for your account
          </Text>
        </View>

        {/* New Password Input */}
        <View style={styles.inputSection}>
          <TextInput
            mode="outlined"
            label="New Password"
            placeholder="Enter your new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            style={styles.textInput}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon={() => showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            disabled={loading}
          />
          {newPassword.length > 0 && (
            <HelperText type="info" style={{ color: passwordStrength.color }}>
              Password strength: {passwordStrength.label}
            </HelperText>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputSection}>
          <TextInput
            mode="outlined"
            label="Confirm Password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            style={styles.textInput}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon={() => showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            disabled={loading}
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <HelperText type="error">
              Passwords don't match
            </HelperText>
          )}
        </View>

        {/* Password Requirements */}
        <View style={[styles.requirementsSection, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.requirementsTitle, { color: theme.colors.onSurfaceVariant }]}>
            Password Requirements:
          </Text>
          <Text style={[styles.requirement, { color: theme.colors.onSurfaceVariant }]}>
            • At least 6 characters long
          </Text>
          <Text style={[styles.requirement, { color: theme.colors.onSurfaceVariant }]}>
            • Recommended: 8+ characters for better security
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleDismiss}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.changeButton}
            disabled={!isValidPassword || loading}
            loading={loading}
            buttonColor={theme.colors.primary}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  requirementsSection: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 13,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  changeButton: {
    flex: 2,
  },
});