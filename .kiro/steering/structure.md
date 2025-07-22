# Project Structure

## Root Directory Organization

### Core Application
- **`app/`** - Expo Router file-based routing structure
  - **`(auth)/`** - Authentication screens (sign in, sign up, password recovery)
  - **`(tabs)/`** - Main tabbed navigation (dashboard, properties, maintenance, finance, tenants, settings)
  - **`_layout.tsx`** - Root layout with providers and RTL setup
  - **`index.tsx`** - App entry point with auth routing logic

### Reusable Code
- **`components/`** - Shared React Native components
  - Use **ModernCard** for consistent card styling
  - Follow **PascalCase** naming convention
  - Include **TypeScript interfaces** for props
- **`hooks/`** - Custom React hooks (useAuth, useApi, useRTL, etc.)
- **`lib/`** - Utility libraries and configurations
  - **`supabase.ts`** - Database client and auth setup
  - **`store.ts`** - Zustand global state management
  - **`types.ts`** - TypeScript type definitions
  - **`theme.ts`** - UI theme and styling constants
  - **`i18n.ts`** - Internationalization setup
  - **`translations/`** - Language files (Arabic/English)

### Configuration & Build
- **`android/`** - Android-specific build configuration
- **`assets/`** - Static assets (images, fonts)
- **`supabase/`** - Database migrations and functions
- **Configuration files**: `app.json`, `package.json`, `tsconfig.json`, etc.

### Testing & Documentation
- **`__tests__/`** - Unit tests with Jest
- **`e2e/`** - End-to-end tests with Detox
- **`docs/`** - Project documentation
- **`requirements/`** - Feature requirements and specifications

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (`ModernCard.tsx`, `PropertyCard.tsx`)
- **Hooks**: camelCase with "use" prefix (`useAuth.ts`, `useApi.ts`)
- **Utilities**: camelCase (`formatters.ts`, `validators.ts`)
- **Types**: camelCase (`types.ts`, `database.types.ts`)
- **Routes**: kebab-case for folders, PascalCase for files

### Code Conventions
- **Interfaces**: PascalCase with descriptive names (`User`, `Property`, `MaintenanceRequest`)
- **Enums/Types**: PascalCase (`UserRole`, `PropertyStatus`, `VoucherType`)
- **Constants**: UPPER_SNAKE_CASE for global constants
- **Functions**: camelCase with descriptive verbs (`getUserProfile`, `updateProperty`)

## Architecture Patterns

### State Management
- **Zustand store** in `lib/store.ts` for global state
- **Separate stores** for different domains (auth, properties, notifications)
- **Persistence** using AsyncStorage for settings and auth state

### Component Structure
- **Atomic design** principles with reusable components
- **Props interfaces** defined for all components
- **Theme consistency** using centralized theme object
- **RTL support** built into all UI components

### Data Flow
- **Supabase client** for all backend operations
- **Real-time subscriptions** for live data updates
- **Error handling** with try-catch and user feedback
- **Loading states** with shimmer placeholders

### Security & Access Control
- **Role-based access** control throughout the app
- **User context** validation for data access
- **Secure storage** for authentication tokens
- **Input validation** and sanitization

## Import Conventions
- Use **path aliases** with `@/` prefix for cleaner imports
- **Absolute imports** preferred over relative imports
- **Group imports**: React/React Native first, then third-party, then local imports