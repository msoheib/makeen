# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start Development Server:**
```bash
npm run dev
```

**Build for Production:**
```bash
npm run build:web
```

**Testing:**
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:ci       # Run tests for CI (no watch)
```

**Linting:**
```bash
npm run lint          # Run Expo linter
npm run lint:i18n     # Lint i18n translation files
```

**E2E Testing:**
```bash
npm run e2e:test      # Build and run Android E2E tests
npm run e2e:test:rtl  # Run RTL-specific E2E tests
npm run e2e:test:forms    # Test all forms
npm run e2e:test:auth      # Test authentication flows
npm run e2e:test:property  # Test property management
npm run e2e:test:tenant    # Test tenant management
npm run e2e:test:maintenance # Test maintenance requests
npm run e2e:test:financial  # Test financial operations
```

**Playwright Web Testing:**
```bash
npm run test:playwright     # Run Playwright tests
npm run test:playwright:ui  # Run Playwright with UI mode
npm run test:qa            # Run QA tests
npm run test:qa:theme      # Test theme and language switching
```

**Platform-Specific:**
```bash
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run clear-auth   # Clear authentication data
```

## Project Architecture

### Technology Stack
- **Framework:** React Native with Expo Router (file-based routing)
- **State Management:** Zustand with persistence via AsyncStorage
- **Backend:** Supabase (PostgreSQL database, authentication, real-time)
- **UI Library:** React Native Paper + NativeWind (Tailwind CSS)
- **Testing:** Jest + React Native Testing Library + Detox (E2E) + Playwright (web)
- **Languages:** TypeScript, English/Arabic (RTL) internationalization
- **Charts:** react-native-chart-kit for data visualization
- **Icons:** Lucide React Native for consistent iconography

### Core Architecture Patterns

**Multi-Role System:**
- **Admin:** Full system access and management
- **Manager:** Property and tenant management capabilities
- **Owner:** Property ownership and financial management
- **Tenant:** Property viewing, maintenance requests, payments
- **Buyer:** Property browsing and inquiry
- **Staff:** Limited access based on assigned responsibilities

**Database Schema (Supabase):**
- **Users:** Multi-role authentication with approval workflows
- **Properties:** Comprehensive property management with types and statuses
- **Tenants:** Tenant management with contracts and foreign tenant support
- **Maintenance:** Request tracking with work orders and cost management
- **Financial:** Vouchers (receipt/payment/journal) and invoicing system
- **Contracts:** Lease management with payment frequencies
- **Notifications:** Comprehensive notification system with categories

### Folder Structure
```
app/                          # Expo Router file-based routing
  (auth)/                    # Authentication screens (login, signup)
  (tabs)/                    # Main app with bottom tab navigation
    _layout.tsx              # Tab navigation with role-based access
    index.tsx                # Dashboard
    reports.tsx              # Financial reports
    tenants.tsx              # Tenant management
    properties.tsx           # Property management
    maintenance.tsx          # Maintenance requests
    settings.tsx            # App settings
  buyer*/                    # Buyer-specific screens
  owner*/                    # Property owner screens
  tenant*/                   # Tenant-specific screens
  manager*/                  # Manager screens
  buildings/                 # Building management
  contracts/                 # Contract management
  finance/                   # Financial operations
  maintenance/               # Maintenance operations
  reports/                   # Report generation
  _layout.tsx                # Root layout with RTL/i18n setup

components/                  # Shared React components
  charts/                   # Chart components (Bar, Pie, Line)
  shimmer/                  # Loading skeleton components
  RTLProvider.tsx           # RTL layout provider
  SplashScreen.tsx          # Custom splash screen
  ModernHeader.tsx          # Header component
  [Various UI components]   # Cards, forms, filters, etc.

lib/                         # Core utilities and configurations
  store.ts                  # Zustand state management (519 lines)
  supabase.ts               # Supabase client configuration
  i18n.ts                   # Internationalization setup
  types.ts                  # TypeScript type definitions
  theme.ts                  # React Native Paper theme with RTL support
  database.types.ts         # Supabase database types
  translations/             # i18n translation files
    en/                     # English translations
    ar/                     # Arabic translations
  api.ts                    # API utilities
  security.ts               # Security utilities
  permissions.ts            # Role-based permissions
  notifications.ts          # Notification system
  [Various utility files]   # PDF, charts, RTL, etc.

hooks/                       # Custom React hooks
  useAuth.ts                # Authentication hook
  useTheme.ts               # Theme management
  useRTL.ts                 # RTL support
  useNotificationBadges.ts  # Notification badges
  [Other custom hooks]

__tests__/                   # Test files
  security/                 # Security-focused tests
  utils/                    # Test utilities and mocks
  setup.ts                  # Jest test setup
```

### Key Architecture Patterns

**State Management:**
- Zustand store (`lib/store.ts`) with two main stores:
  - `useAppStore`: Main application state (auth, properties, settings, finances)
  - `useNotificationBadgeStore`: Notification badge counts
- Persistent storage with AsyncStorage for settings and auth state
- Store hydration check required before app initialization
- Real-time updates via Supabase subscriptions

**Authentication & Backend:**
- Supabase integration with custom storage adapter
- Session management via SecureStore (native) / localStorage (web)
- Row-Level Security (RLS) for tenant isolation
- Comprehensive user approval workflows
- Database types defined in `lib/database.types.ts`

**Internationalization (i18n):**
- Full Arabic (RTL) and English support via i18next
- RTL layout handling with immediate direction switching
- Translation files in `lib/translations/[locale]/` organized by domain
- Custom fonts: Cairo for Arabic, Inter for English
- Language debugger accessible via Ctrl+Shift+L

**Navigation System:**
- Expo Router with file-based routing and dynamic routes
- Drawer navigation for main app areas with role-based filtering
- Bottom tabs for core functionality with permission-based access
- Role-based UI rendering (tabs and features hidden/show based on user role)

**Security Features:**
- Row-Level Security for tenant data isolation
- Role-based access control system
- Comprehensive session validation
- Audit logging for all critical operations
- Secure storage for sensitive data

**Financial Management:**
- Complete voucher system (receipt/payment/journal)
- Invoicing with VAT calculations
- Multi-currency support (primary: SAR)
- Financial reporting and analytics
- PDF generation for invoices and reports

**Real-time Features:**
- Live notification system with categories
- Real-time data updates across users
- Activity feeds for property/tenant changes
- Badge counters for actionable items

## Development Guidelines

**Project Policy Compliance:**
- This project follows strict development policies defined in `.cursor/rules/discipline.mdc`
- **Task-Driven Development**: No code changes without explicit task authorization
- **PBI Association**: All tasks must be associated with Product Backlog Items
- **Controlled File Creation**: No files created outside defined structures without explicit approval
- **External Package Research**: Document API usage for new packages in task-specific guides
- **Task Granularity**: Break down complex features into small, testable units

**RTL Support:**
- The app has simplified RTL initialization for production compatibility
- RTL layout is applied immediately without app reload (no restart required)
- Use `useRTL` hook for RTL-aware styling in components
- Test RTL functionality with `npm run e2e:test:rtl`
- Language debugger accessible via Ctrl+Shift+L for troubleshooting
- Custom fonts: Cairo for Arabic, Inter for English

**State Management:**
- Always check `isHydrated` before using store values in components
- Use proper TypeScript types from `lib/types.ts`
- Update both stores when modifying notification-related state
- Real-time subscriptions should be properly managed (subscribe/unsubscribe)
- Use Zustand's persist middleware for data that should survive app restarts

**Testing Strategy:**
- **Unit Tests**: Jest with React Native Testing Library in `__tests__/`
- **Integration Tests**: Component interaction tests with proper mocking
- **E2E Tests**: Detox framework for Android emulator testing
- **Web Tests**: Playwright for browser compatibility testing
- **Security Tests**: Comprehensive security test suite in `__tests__/security/`
- **RTL Tests**: Dedicated RTL-specific E2E tests
- Mock services available in `__tests__/utils/mockServices.ts`

**Code Style & Patterns:**
- TypeScript strict mode enabled with comprehensive type safety
- Follow existing component patterns for consistency
- Use NativeWind (Tailwind CSS) classes for styling
- Use React Native Paper components for consistent UI
- Implement proper error handling and loading states
- Use constants for repeated values (no magic numbers/strings)

**Security Best Practices:**
- Implement proper input validation and sanitization
- Use secure storage for sensitive data (expo-secure-store)
- Follow Supabase RLS policies for data access
- Implement proper session management and token refresh
- Audit logging for all critical operations
- Never expose sensitive information in logs or error messages

**Performance Considerations:**
- Use React Native's performance optimization tools
- Implement proper image loading and caching
- Use FlatList for long lists with proper key extraction
- Implement virtualization for large datasets
- Monitor bundle size and implement code splitting
- Use React.memo and useCallback where appropriate

**Database Integration:**
- Use TypeScript types from `lib/database.types.ts`
- Follow Supabase best practices for queries and subscriptions
- Implement proper error handling for database operations
- Use real-time subscriptions efficiently and clean up properly
- Implement optimistic UI updates where appropriate

## Important Files

- `app/_layout.tsx`: Root layout with RTL/i18n initialization and font loading
- `lib/store.ts`: Central state management (519 lines) with full app state
- `lib/supabase.ts`: Database client configuration and authentication
- `lib/i18n.ts`: Internationalization setup with language detection
- `lib/types.ts`: Comprehensive TypeScript type definitions
- `lib/permissions.ts`: Role-based permission system
- `lib/security.ts`: Security utilities and best practices
- `.cursor/rules/discipline.mdc`: Comprehensive project development policy
- `jest.config.js`: Jest configuration with Expo preset
- `playwright.config.ts`: Playwright E2E testing configuration

## Project Context

This is a comprehensive **"Makeen"** Property Management System supporting property owners, tenants, buyers, and managers with enterprise-grade features including:

**Core Features:**
- Property management and listings with detailed information
- Financial tracking (invoices, vouchers, payments, receipts)
- Maintenance request management with work orders
- Multi-language support (Arabic/English) with full RTL
- Document management and PDF generation
- Real-time notifications and activity feeds
- Role-based access control across 6 user types
- Contract management with payment schedules
- Building and unit management
- Analytics and reporting dashboard

**Technical Excellence:**
- Enterprise-grade security with Row-Level Security
- Comprehensive testing strategy (unit, integration, E2E, security)
- Real-time data synchronization across users
- Responsive design with mobile-first approach
- Accessibility compliance with WCAG standards
- Performance monitoring and optimization
- Comprehensive audit logging

**Development Discipline:**
- Task-driven development with strict change control
- Comprehensive documentation requirements
- Security-first development approach
- Multi-layer testing strategy
- Code quality enforcement through linting and type checking
- Controlled file creation and modification processes

The system demonstrates production-ready architecture with proper separation of concerns, comprehensive error handling, and enterprise-scale features suitable for property management companies.