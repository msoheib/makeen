# Technology Stack

## Framework & Platform
- **React Native** with **Expo SDK 53** for cross-platform mobile development
- **Expo Router** for file-based navigation with typed routes
- **TypeScript** for type safety and better developer experience
- **Metro** bundler with CSS support enabled

## Backend & Database
- **Supabase** for backend-as-a-service (PostgreSQL database, auth, real-time, storage)
- **Supabase Auth** for user authentication and session management
- **Real-time subscriptions** for live data updates

## State Management & Data
- **Zustand** for global state management with persistence
- **AsyncStorage** for local data persistence
- **SecureStore** (native) / **localStorage** (web) for secure token storage

## UI & Styling
- **React Native Paper** for Material Design components
- **NativeWind** for Tailwind CSS styling in React Native
- **Expo Linear Gradient** for gradient effects
- **React Native Reanimated** for smooth animations
- **Lucide React Native** for consistent iconography

## Internationalization & RTL
- **i18next** with **react-i18next** for translations
- **expo-localization** for device locale detection
- **I18nManager** for RTL layout support
- Arabic (RTL) and English language support

## Development Tools
- **ESLint** with Expo config for code linting
- **Prettier** for code formatting
- **Jest** with **@testing-library/react-native** for unit testing
- **Detox** for end-to-end testing on Android

## Common Commands

### Development
```bash
npm run dev              # Start development server with web support
npm run android          # Run on Android device/emulator
npm run ios              # Run on iOS device/simulator
```

### Building
```bash
npm run build:web        # Build for web deployment
npm run lint             # Run ESLint
```

### Testing
```bash
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run e2e:test         # Run end-to-end tests on Android
```

### Utilities
```bash
npm run clear-auth       # Clear authentication data
```

## Key Libraries
- **@supabase/supabase-js**: Database and auth client
- **date-fns**: Date manipulation and formatting
- **react-native-chart-kit**: Charts and data visualization
- **expo-camera**: Camera functionality for photo capture
- **expo-print**: PDF generation and printing
- **react-native-shimmer-placeholder**: Loading state animations