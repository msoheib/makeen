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
```

**E2E Testing:**
```bash
npm run e2e:test      # Build and run Android E2E tests
npm run e2e:test:rtl  # Run RTL-specific E2E tests
```

## Project Architecture

### Technology Stack
- **Framework:** React Native with Expo Router (file-based routing)
- **State Management:** Zustand with persistence via AsyncStorage
- **Backend:** Supabase (PostgreSQL database, authentication, real-time)
- **UI Library:** React Native Paper + NativeWind (Tailwind CSS)
- **Testing:** Jest + React Native Testing Library + Detox (E2E)
- **Languages:** TypeScript, English/Arabic (RTL) internationalization

### Folder Structure
```
app/                    # Expo Router file-based routing
  (auth)/              # Authentication screens (login, signup)
  (drawer)/            # Main app with drawer navigation
    (tabs)/            # Bottom tab navigation screens
  buyer*/              # Buyer role specific screens
  owner*/              # Owner role specific screens  
  tenant*/             # Tenant role specific screens
components/            # Shared React components
lib/                   # Core utilities and configurations
  store.ts             # Zustand state management
  supabase.ts          # Supabase client configuration
  i18n.ts              # Internationalization setup
  types.ts             # TypeScript type definitions
hooks/                 # Custom React hooks
__tests__/             # Test files (Jest + RTL)
```

### Key Architecture Patterns

**State Management:**
- Zustand store (`lib/store.ts`) with two main stores:
  - `useAppStore`: Main application state (auth, properties, settings)
  - `useNotificationBadgeStore`: Notification badge counts
- Persistent storage with AsyncStorage for settings and auth state
- Store hydration check required before app initialization

**Authentication & Backend:**
- Supabase integration with custom storage adapter
- Session management via SecureStore (native) / localStorage (web)
- Database types defined in `lib/database.types.ts`

**Internationalization:**
- Arabic (RTL) and English support via i18next
- RTL layout handling with automatic app reload for direction changes
- Translation files in `lib/translations/[locale]/`
- Complex RTL initialization sequence in root layout

**Navigation:**
- Expo Router with file-based routing
- Drawer navigation for main app areas
- Bottom tabs for core functionality
- Role-based screen organization (buyer/owner/tenant)

**Multi-tenancy & Roles:**
- Support for different user roles: Property Owners, Tenants, Buyers
- Role-specific dashboards and feature access
- Property management with owner relationships

## Development Guidelines

**RTL Support:**
- The app has simplified RTL initialization for production compatibility
- RTL layout is applied immediately without app reload
- Use `useRTL` hook for RTL-aware styling in components
- Test RTL functionality with `npm run e2e:test:rtl`
- RTL configuration is applied during i18n initialization for consistent behavior

**State Management:**
- Always check `isHydrated` before using store values in components
- Use proper TypeScript types from `lib/types.ts`
- Update both stores when modifying notification-related state

**Testing:**
- Unit tests in `__tests__/` with Jest setup
- E2E tests use Detox framework for Android emulator
- Mock services available in `__tests__/utils/mockServices.ts`

**Code Style:**
- TypeScript strict mode enabled
- Follow existing component patterns for consistency
- Use NativeWind classes for styling

## Important Files

- `app/_layout.tsx`: Root layout with RTL initialization and font loading
- `lib/store.ts`: Central state management (519 lines)
- `lib/supabase.ts`: Database client configuration
- `lib/i18n.ts`: Internationalization setup
- `.cursor/rules/discipline.mdc`: Comprehensive project development policy
- `jest.config.js`: Test configuration

## Project Context

This is a comprehensive real estate management system supporting property owners, tenants, and buyers with features including:
- Property management and listings
- Financial tracking (invoices, vouchers, payments)
- Maintenance request management
- Multi-language support (Arabic/English)
- Document management and PDF generation
- Real-time notifications
- Role-based access control

The codebase follows strict development policies defined in `.cursor/rules/discipline.mdc` including task-driven development, PBI association, and controlled file creation.