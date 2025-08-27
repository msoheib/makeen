// Jest setup file for React Native testing
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-localize
jest.mock('react-native-localize', () => ({
  getLocales: () => [
    {
      countryCode: 'US',
      languageTag: 'en-US',
      languageCode: 'en',
      isRTL: false,
    },
  ],
  getCountry: () => 'US',
  getLanguages: () => ['en'],
  getTimeZone: () => 'America/New_York',
  isRTL: false,
  findBestAvailableLanguage: () => ({
    languageTag: 'en',
    isRTL: false,
  }),
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: () => [
    {
      languageCode: 'en',
      countryCode: 'US',
      languageTag: 'en-US',
      decimalSeparator: '.',
      digitGroupingSeparator: ',',
    },
  ],
  isRTL: false,
  locale: 'en',
  locales: ['en'],
  timezone: 'America/New_York',
}));

// Mock expo-updates
jest.mock('expo-updates', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
  updateAsync: jest.fn(() => Promise.resolve()),
  reloadAsync: jest.fn(() => Promise.resolve()),
  checkForUpdateAsync: jest.fn(() => Promise.resolve({ isAvailable: false })),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
  getPresentedNotificationsAsync: jest.fn(() => Promise.resolve([])),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    canGoBack: jest.fn(() => false),
  }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  useGlobalSearchParams: () => ({}),
  Stack: {
    Screen: () => null,
  },
  Slot: () => null,
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: any) => children,
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
    })),
    removeChannel: jest.fn(),
  })),
}));

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const mockComponent = ({ children, ...props }: any) => children;
  return {
    Provider: mockComponent,
    DefaultTheme: {},
    Button: mockComponent,
    Card: mockComponent,
    Text: mockComponent,
    IconButton: mockComponent,
    Badge: mockComponent,
    Chip: mockComponent,
    Menu: mockComponent,
    Searchbar: mockComponent,
    ActivityIndicator: mockComponent,
  };
});

// Mock Linking
jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
}));

// Mock the custom hooks
jest.mock('@/hooks/useApi', () => ({
  useApi: jest.fn(() => ({ data: 0, loading: false, error: null })),
}));

jest.mock('@/hooks/useRouteContext', () => ({
  useRouteContext: jest.fn(() => ({
    shouldShowBackButton: true,
    shouldShowHamburger: false,
    routeType: 'NON_TAB_PAGE',
    hasBottomNavbar: false,
    currentRoute: '/',
    segments: [],
  })),
}));

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

// Silence console warnings during tests
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalConsoleWarn.call(console, ...args);
};

// Global test timeout
jest.setTimeout(10000); 