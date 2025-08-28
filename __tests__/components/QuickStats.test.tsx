import React from 'react';
import { render } from '@testing-library/react-native';
import QuickStats from '@/components/QuickStats';

// Mock the store hook
jest.mock('@/lib/store', () => ({
  useAppStore: () => ({
    isDarkMode: false,
  }),
}));

// Mock the theme
jest.mock('@/lib/theme', () => ({
  lightTheme: {
    colors: {
      primary: '#007AFF',
      surface: '#FFFFFF',
      onSurfaceVariant: '#666666',
    },
  },
  darkTheme: {
    colors: {
      primary: '#0A84FF',
      surface: '#1C1C1E',
      onSurfaceVariant: '#8E8E93',
    },
  },
  spacing: {
    m: 16,
    s: 8,
  },
}));

// Mock the formatters
jest.mock('@/lib/formatters', () => ({
  formatDisplayNumber: (num: number) => num.toString(),
}));

describe('QuickStats', () => {
  const defaultProps = {
    total: 25,
    active: 20,
    pending: 5,
  };

  it('renders without crashing', () => {
    const { toJSON } = render(<QuickStats {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with owners when showOwners is true', () => {
    const { toJSON } = render(
      <QuickStats 
        {...defaultProps} 
        owners={10} 
        showOwners={true} 
      />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders without owners when showOwners is false', () => {
    const { toJSON } = render(
      <QuickStats 
        {...defaultProps} 
        owners={10} 
        showOwners={false} 
      />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders loading state correctly', () => {
    const { toJSON } = render(<QuickStats {...defaultProps} loading={true} />);
    expect(toJSON()).toBeTruthy();
  });

  it('handles zero values correctly', () => {
    const { toJSON } = render(
      <QuickStats 
        total={0} 
        active={0} 
        pending={0} 
      />
    );
    expect(toJSON()).toBeTruthy();
  });
});
