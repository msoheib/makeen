import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AddPersonScreen } from '@/app/people/add';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { createTenantComplete } from '@/lib/tenantCreation';

// Mock hooks and dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/store');
jest.mock('@/lib/tenantCreation');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;
const mockCreateTenantComplete = createTenantComplete as jest.MockedFunction<typeof createTenantComplete>;

describe('Form UX Security Tests', () => {
  const mockUser = {
    id: 'manager-123',
    email: 'manager@test.com',
    user_metadata: { role: 'manager' },
  };

  const mockStore = {
    updateSettings: jest.fn(),
    settings: {
      userProfile: {
        name: 'Manager User',
        email: 'manager@test.com',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });

    mockUseAppStore.mockReturnValue(mockStore);

    mockCreateTenantComplete.mockResolvedValue({
      success: true,
      error: null,
      userId: 'tenant-456',
      profile: {
        id: 'tenant-456',
        email: 'tenant@test.com',
        first_name: 'Test',
        last_name: 'Tenant',
        role: 'tenant',
      },
    });
  });

  describe('Form Validation', () => {
    test('validates email format in real-time', async () => {
      const { getByLabelText, getByText, queryByText } = render(<AddPersonScreen />);

      const emailInput = getByLabelText('Email');

      // Enter invalid email
      await act(async () => {
        fireEvent.changeText(emailInput, 'invalid-email');
      });

      // Should show email validation error
      await waitFor(() => {
        expect(getByText('Please enter a valid email address')).toBeTruthy();
      });

      // Enter valid email
      await act(async () => {
        fireEvent.changeText(emailInput, 'valid@email.com');
      });

      // Error should disappear
      await waitFor(() => {
        expect(queryByText('Please enter a valid email address')).toBeNull();
      });
    });

    test('validates required fields', async () => {
      const { getByText, getByLabelText } = render(<AddPersonScreen />);

      // Attempt to submit empty form
      await act(async () => {
        fireEvent.press(getByText('Add Person'));
      });

      // Should show validation errors for required fields
      await waitFor(() => {
        expect(getByText('First name is required')).toBeTruthy();
        expect(getByText('Last name is required')).toBeTruthy();
        expect(getByText('Please enter a valid email address')).toBeTruthy();
        expect(getByText('Password must be at least 8 characters')).toBeTruthy();
      });
    });

    test('validates password strength', async () => {
      const { getByLabelText, getByText, queryByText } = render(<AddPersonScreen />);

      const passwordInput = getByLabelText('Password');

      // Enter weak password
      await act(async () => {
        fireEvent.changeText(passwordInput, '123');
      });

      await waitFor(() => {
        expect(getByText('Password must be at least 8 characters')).toBeTruthy();
      });

      // Enter strong password
      await act(async () => {
        fireEvent.changeText(passwordInput, 'securePassword123');
      });

      await waitFor(() => {
        expect(queryByText('Password must be at least 8 characters')).toBeNull();
      });
    });
  });

  describe('Form Submission', () => {
    test('shows loading state during submission', async () => {
      // Make the function take time to complete
      mockCreateTenantComplete.mockImplementationOnce(
        () => new Promise(resolve => {
          setTimeout(() => resolve({
            success: true,
            error: null,
            userId: 'tenant-456',
            profile: { id: 'tenant-456', email: 'tenant@test.com' }
          }), 100);
        })
      );

      const { getByText, getByLabelText, queryByText } = render(<AddPersonScreen />);

      // Fill form
      await act(async () => {
        fireEvent.changeText(getByLabelText('Email'), 'tenant@test.com');
        fireEvent.changeText(getByLabelText('First Name'), 'Test');
        fireEvent.changeText(getByLabelText('Last Name'), 'Tenant');
        fireEvent.changeText(getByLabelText('Password'), 'securePassword123');
      });

      // Submit form
      await act(async () => {
        fireEvent.press(getByText('Add Person'));
      });

      // Should show loading state
      await waitFor(() => {
        expect(getByText('Creating account...')).toBeTruthy();
      });

      // Button should be disabled during loading
      expect(getByText('Add Person')).toBeDisabled();

      // Wait for submission to complete
      await waitFor(() => {
        expect(queryByText('Creating account...')).toBeNull();
      }, 200);
    });

    test('displays success message on successful submission', async () => {
      const { getByText, getByLabelText } = render(<AddPersonScreen />);

      // Fill and submit form
      await act(async () => {
        fireEvent.changeText(getByLabelText('Email'), 'tenant@test.com');
        fireEvent.changeText(getByLabelText('First Name'), 'Test');
        fireEvent.changeText(getByLabelText('Last Name'), 'Tenant');
        fireEvent.changeText(getByLabelText('Password'), 'securePassword123');
        fireEvent.press(getByText('Add Person'));
      });

      // Should show success message
      await waitFor(() => {
        expect(getByText('Tenant created successfully')).toBeTruthy();
      });

      expect(mockCreateTenantComplete).toHaveBeenCalledWith({
        email: 'tenant@test.com',
        password: 'securePassword123',
        first_name: 'Test',
        last_name: 'Tenant',
        role: 'tenant'
      });
    });

    test('displays error message on submission failure', async () => {
      mockCreateTenantComplete.mockResolvedValueOnce({
        success: false,
        error: 'Email already registered',
        userId: null,
        profile: null,
      });

      const { getByText, getByLabelText } = render(<AddPersonScreen />);

      // Fill and submit form
      await act(async () => {
        fireEvent.changeText(getByLabelText('Email'), 'existing@test.com');
        fireEvent.changeText(getByLabelText('First Name'), 'Test');
        fireEvent.changeText(getByLabelText('Last Name'), 'Tenant');
        fireEvent.changeText(getByLabelText('Password'), 'securePassword123');
        fireEvent.press(getByText('Add Person'));
      });

      // Should show error message
      await waitFor(() => {
        expect(getByText('Email already registered')).toBeTruthy();
      });
    });

    test('resets form after successful submission', async () => {
      const { getByText, getByLabelText, queryByText } = render(<AddPersonScreen />);

      // Fill and submit form
      await act(async () => {
        fireEvent.changeText(getByLabelText('Email'), 'tenant@test.com');
        fireEvent.changeText(getByLabelText('First Name'), 'Test');
        fireEvent.changeText(getByLabelText('Last Name'), 'Tenant');
        fireEvent.changeText(getByLabelText('Password'), 'securePassword123');
        fireEvent.press(getByText('Add Person'));
      });

      // Wait for success
      await waitFor(() => {
        expect(getByText('Tenant created successfully')).toBeTruthy();
      });

      // Form should be reset (empty fields)
      expect(getByLabelText('Email').props.value).toBe('');
      expect(getByLabelText('First Name').props.value).toBe('');
      expect(getByLabelText('Last Name').props.value).toBe('');
      expect(getByLabelText('Password').props.value).toBe('');
    });
  });

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      mockCreateTenantComplete.mockRejectedValueOnce(
        new Error('Network error')
      );

      const { getByText, getByLabelText } = render(<AddPersonScreen />);

      // Fill and submit form
      await act(async () => {
        fireEvent.changeText(getByLabelText('Email'), 'tenant@test.com');
        fireEvent.changeText(getByLabelText('First Name'), 'Test');
        fireEvent.changeText(getByLabelText('Last Name'), 'Tenant');
        fireEvent.changeText(getByLabelText('Password'), 'securePassword123');
        fireEvent.press(getByText('Add Person'));
      });

      // Should show error message
      await waitFor(() => {
        expect(getByText('Failed to create tenant. Please try again.')).toBeTruthy();
      });
    });

    test('re-enables submit button after error', async () => {
      mockCreateTenantComplete.mockRejectedValueOnce(
        new Error('Network error')
      );

      const { getByText, getByLabelText } = render(<AddPersonScreen />);

      // Fill and submit form
      await act(async () => {
        fireEvent.changeText(getByLabelText('Email'), 'tenant@test.com');
        fireEvent.changeText(getByLabelText('First Name'), 'Test');
        fireEvent.changeText(getByLabelText('Last Name'), 'Tenant');
        fireEvent.changeText(getByLabelText('Password'), 'securePassword123');
        fireEvent.press(getByText('Add Person'));
      });

      // Wait for error
      await waitFor(() => {
        expect(getByText('Failed to create tenant. Please try again.')).toBeTruthy();
      });

      // Button should be re-enabled
      expect(getByText('Add Person')).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('form fields have proper accessibility labels', () => {
      const { getByLabelText } = render(<AddPersonScreen />);

      expect(getByLabelText('Email')).toBeTruthy();
      expect(getByLabelText('First Name')).toBeTruthy();
      expect(getByLabelText('Last Name')).toBeTruthy();
      expect(getByLabelText('Password')).toBeTruthy();
      expect(getByLabelText('Phone (Optional)')).toBeTruthy();
    });

    test('submit button is accessible', () => {
      const { getByRole } = render(<AddPersonScreen />);

      const submitButton = getByRole('button', { name: /add person/i });
      expect(submitButton).toBeTruthy();
    });

    test('error messages are accessible', async () => {
      const { getByLabelText, getByText } = render(<AddPersonScreen />);

      // Trigger validation error
      await act(async () => {
        fireEvent.changeText(getByLabelText('Email'), 'invalid-email');
      });

      await waitFor(() => {
        const errorMessage = getByText('Please enter a valid email address');
        expect(errorMessage).toBeTruthy();
      });
    });
  });

  describe('Role Field', () => {
    test('includes role field in form submission', async () => {
      const { getByText, getByLabelText } = render(<AddPersonScreen />);

      // Fill form including role selection
      await act(async () => {
        fireEvent.changeText(getByLabelText('Email'), 'tenant@test.com');
        fireEvent.changeText(getByLabelText('First Name'), 'Test');
        fireEvent.changeText(getByLabelText('Last Name'), 'Tenant');
        fireEvent.changeText(getByLabelText('Password'), 'securePassword123');
        // Select role (assuming this is done via a picker or radio buttons)
      });

      await act(async () => {
        fireEvent.press(getByText('Add Person'));
      });

      // Verify role is included in submission
      expect(mockCreateTenantComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'tenant' // Default role
        })
      );
    });
  });
});