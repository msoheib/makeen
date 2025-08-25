import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ModernHeader from '@/components/ModernHeader';
import { useRouter } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock the notificationsApi
jest.mock('@/lib/api', () => ({
  notificationsApi: {
    getUnreadCount: jest.fn(() => Promise.resolve({ data: 0, error: null })),
  },
}));

// Mock the useApi hook
jest.mock('@/hooks/useApi', () => ({
  useApi: jest.fn(() => ({ data: 0, loading: false, error: null })),
}));

// Mock the useAppStore hook
jest.mock('@/lib/store', () => ({
  useAppStore: jest.fn(() => ({ 
    isDarkMode: false,
    settings: {},
    user: null,
    isAuthenticated: false,
    isLoading: false,
    properties: [],
    maintenanceRequests: [],
    invoices: [],
    vouchers: [],
    notifications: [],
    isHydrated: true,
  })),
}));

// Mock the useSafeAreaInsets hook
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

// Mock the useRouteContext hook
jest.mock('@/hooks/useRouteContext', () => ({
  useRouteContext: jest.fn(() => ({
    shouldShowBackButton: true,
    shouldShowHamburger: false,
  })),
}));

// Mock the useNavigation hook
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  })),
}));

// Mock the theme and other utilities
jest.mock('@/lib/theme', () => ({
  lightTheme: {
    colors: {
      primary: '#6200ee',
      onPrimary: '#ffffff',
      surface: '#ffffff',
      onSurface: '#000000',
      onSurfaceVariant: '#666666',
      error: '#b00020',
    },
  },
  darkTheme: {
    colors: {
      primary: '#bb86fc',
      onPrimary: '#000000',
      surface: '#121212',
      onSurface: '#ffffff',
      onSurfaceVariant: '#b3b3b3',
      error: '#cf6679',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
}));

jest.mock('@/lib/rtl', () => ({
  rtlStyles: {
    alignItemsStart: {},
    textAlign: () => ({}),
  },
  getFlexDirection: () => 'row',
}));

jest.mock('@/lib/i18n', () => ({
  isRTL: () => false,
}));

describe('ModernHeader Smart Navigation', () => {
  const mockRouter = {
    pathname: '',
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should navigate to Documents tab when in document subsection', () => {
    mockRouter.pathname = '/documents/123';
    
    const { getByLabelText } = render(
      <ModernHeader
        title="Document Viewer"
        showBackButton={true}
      />
    );

    const backButton = getByLabelText('العودة');
    fireEvent.press(backButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/(drawer)/(tabs)/documents');
  });

  it('should navigate to Reports tab when in report subsection', () => {
    mockRouter.pathname = '/reports/revenue';
    
    const { getByLabelText } = render(
      <ModernHeader
        title="Revenue Report"
        showBackButton={true}
      />
    );

    const backButton = getByLabelText('العودة');
    fireEvent.press(backButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/(drawer)/(tabs)/reports');
  });

  it('should navigate to Properties tab when in property subsection', () => {
    mockRouter.pathname = '/properties/456';
    
    const { getByLabelText } = render(
      <ModernHeader
        title="Property Details"
        showBackButton={true}
      />
    );

    const backButton = getByLabelText('العودة');
    fireEvent.press(backButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/(drawer)/(tabs)/properties');
  });

  it('should navigate to Tenants tab when in tenant subsection', () => {
    mockRouter.pathname = '/tenants/789';
    
    const { getByLabelText } = render(
      <ModernHeader
        title="Tenant Details"
        showBackButton={true}
      />
    );

    const backButton = getByLabelText('العودة');
    fireEvent.press(backButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/(drawer)/(tabs)/tenants');
  });

  it('should navigate to Settings tab when in profile subsection', () => {
    mockRouter.pathname = '/profile/';
    
    const { getByLabelText } = render(
      <ModernHeader
        title="Profile"
        showBackButton={true}
      />
    );

    const backButton = getByLabelText('العودة');
    fireEvent.press(backButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/(drawer)/(tabs)/settings');
  });

  it('should fall back to router.back() when no smart mapping found', () => {
    mockRouter.pathname = '/unknown/route';
    mockRouter.canGoBack.mockReturnValue(true);
    
    const { getByLabelText } = render(
      <ModernHeader
        title="Unknown Page"
        showBackButton={true}
      />
    );

    const backButton = getByLabelText('العودة');
    fireEvent.press(backButton);

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('should fall back to dashboard when no smart mapping and cannot go back', () => {
    mockRouter.pathname = '/unknown/route';
    mockRouter.canGoBack.mockReturnValue(false);
    
    const { getByLabelText } = render(
      <ModernHeader
        title="Unknown Page"
        showBackButton={true}
      />
    );

    const backButton = getByLabelText('العودة');
    fireEvent.press(backButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/(drawer)/(tabs)/');
  });

  it('should use custom onBackPress when provided', () => {
    const customOnBackPress = jest.fn();
    
    const { getByLabelText } = render(
      <ModernHeader
        title="Test Page"
        showBackButton={true}
        onBackPress={customOnBackPress}
      />
    );

    const backButton = getByLabelText('العودة');
    fireEvent.press(backButton);

    expect(customOnBackPress).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});
