# Web Migration Guide - Phase 1 Summary

## What Was Accomplished

### 1. Branch & Infrastructure Setup ✅
- Created `web-react` branch from `main`
- Configured Vite as the build tool (replacing Metro bundler)
- Set up React 18 with TypeScript 5.8
- Configured Tailwind CSS for styling
- Set up ESLint for code quality

### 2. Dependencies Migration ✅

**Replaced React Native packages with web equivalents:**
- ✅ `expo-router` → `react-router-dom` v7
- ✅ `react-native-paper` → `@mui/material` v6
- ✅ `nativewind` → standard `tailwindcss`
- ✅ `expo-secure-store` + `AsyncStorage` → `crypto-js` + `localStorage`
- ✅ `react-native-chart-kit` → `chart.js` + `react-chartjs-2`
- ✅ `expo-fonts` → `@fontsource/cairo` + `@fontsource/inter`
- ✅ `lucide-react-native` → `lucide-react`

**Preserved platform-agnostic packages:**
- ✅ `@supabase/supabase-js` (backend)
- ✅ `zustand` (state management)
- ✅ `i18next` + `react-i18next` (internationalization)
- ✅ `date-fns` (date utilities)

### 3. Core Library Adaptation ✅

**Created `lib/supabase.web.ts`:**
- Removed React Native `Platform` API
- Removed `expo-secure-store` dependency
- Implemented encrypted localStorage using `crypto-js`
- Added SecureWebStorage class for sensitive data encryption
- Preserved all authentication logic and session management

**Modified `lib/store.ts`:**
- Removed React Native `Platform` import
- Removed `AsyncStorage` import
- Simplified storage to use `localStorage` directly
- Kept all business logic, state management, and TypeScript types intact

### 4. Application Structure ✅

**Created web entry point:**
- `index.html` - HTML entry point for Vite
- `src/main.tsx` - React application bootstrap
- `src/App.tsx` - Root component with routing and theming
- `src/index.css` - Global styles with Tailwind directives

**Created authentication pages:**
- `src/pages/auth/LoginPage.tsx` - Full-featured login with validation
- `src/pages/auth/SignupPage.tsx` - User registration with role selection
- Both pages use Material-UI components and integrate with Supabase

**Created layout system:**
- `src/layouts/DashboardLayout.tsx` - Protected route wrapper with auth check

### 5. Configuration Files ✅

**Build & Dev Tools:**
- `vite.config.ts` - Vite configuration with path aliases
- `tsconfig.json` - TypeScript config for web (bundler mode)
- `tsconfig.node.json` - TypeScript config for build scripts

**Styling:**
- `tailwind.config.js` - Tailwind with custom primary colors
- `postcss.config.js` - PostCSS for Tailwind processing

**Code Quality:**
- `.eslintrc.cjs` - ESLint rules for React + TypeScript
- Configured to ignore `app/` and `components/` (React Native directories)

**Environment:**
- `.env.example` - Template for environment variables

## What Still Needs Migration

### Phase 2: Component Library (Next Priority)
- [ ] Create web versions of custom components from `components/`
- [ ] Map React Native primitives to HTML (View→div, Text→span/p, etc.)
- [ ] Replace React Native Paper components with MUI equivalents
- [ ] Adapt chart components to use Chart.js

### Phase 3: Routing & Navigation
- [ ] Migrate file-based routes from `app/` to React Router configuration
- [ ] Implement role-based route guards
- [ ] Create sidebar/drawer navigation
- [ ] Implement breadcrumbs

### Phase 4: Feature Screens
- [ ] Dashboard (role-specific dashboards)
- [ ] Properties (list, details, add/edit, sub-properties)
- [ ] Tenants (list, details, contracts)
- [ ] Finance (vouchers, invoices, payments)
- [ ] Maintenance (requests, work orders)
- [ ] Reports (all financial and operational reports)
- [ ] Settings (profile, preferences, notifications)

### Phase 5: Advanced Features
- [ ] Real-time notifications
- [ ] PDF generation (invoices, reports)
- [ ] File upload and management
- [ ] Advanced search and filtering
- [ ] Data export functionality

### Phase 6: Testing & Deployment
- [ ] Playwright E2E tests for web
- [ ] Responsive design testing
- [ ] RTL (Arabic) theme refinement
- [ ] Performance optimization
- [ ] Production deployment setup

## How to Continue Development

### Setting Up the Development Environment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env` file**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

### Development Workflow

1. **Component Migration Pattern**:
   - Read the React Native component in `components/`
   - Identify React Native-specific code (View, Text, StyleSheet, etc.)
   - Create equivalent in `src/components/` using:
     - `div`, `span`, `p`, `h1-h6` for layout/text
     - Tailwind classes for styling
     - MUI components for complex UI (buttons, inputs, dialogs)
   - Test in browser to ensure functionality

2. **Screen Migration Pattern**:
   - Read screen from `app/[screen].tsx`
   - Identify route structure and navigation
   - Create page in `src/pages/[category]/[screen].tsx`
   - Add route to `src/App.tsx` or relevant layout
   - Migrate UI using the component migration pattern
   - Test authentication and permissions

3. **Testing Strategy**:
   - Use browser DevTools for debugging
   - Test both English and Arabic (RTL) modes
   - Test responsive design (mobile, tablet, desktop)
   - Use Playwright for E2E tests

### Key Files to Reference

**When migrating components:**
- Reference: `components/[ComponentName].tsx` (React Native version)
- Create: `src/components/[ComponentName].tsx` (Web version)
- Style guide: MUI components + Tailwind utilities

**When migrating screens:**
- Reference: `app/[route]/[screen].tsx` (React Native version)
- Create: `src/pages/[category]/[screen].tsx` (Web version)
- Update routing: `src/App.tsx` or `src/layouts/DashboardLayout.tsx`

**When adapting business logic:**
- Keep: All logic in `lib/` directory (mostly unchanged)
- Adapt: Only Platform-specific code (storage, navigation)
- Test: Ensure Supabase queries work identically

## Common Migration Patterns

### React Native → Web Component Mapping

```tsx
// React Native
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
      <TouchableOpacity onPress={() => {}}>
        <Text>Click me</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: 'white' },
  title: { fontSize: 24, fontWeight: 'bold' },
});
```

```tsx
// Web React
import { Box, Typography, Button } from '@mui/material';

function MyComponent() {
  return (
    <Box className="p-4 bg-white">
      <Typography variant="h4" className="font-bold">
        Hello
      </Typography>
      <Button onClick={() => {}}>
        Click me
      </Button>
    </Box>
  );
}
```

### Navigation Migration

```tsx
// React Native (Expo Router)
import { router } from 'expo-router';

// Navigate
router.push('/properties/123');
router.back();

// Get params
const { id } = useLocalSearchParams();
```

```tsx
// Web React (React Router)
import { useNavigate, useParams } from 'react-router-dom';

const navigate = useNavigate();
const { id } = useParams();

// Navigate
navigate('/properties/123');
navigate(-1);
```

### Storage Migration

```tsx
// React Native
import AsyncStorage from '@react-native-async-storage/async-storage';

const data = await AsyncStorage.getItem('key');
await AsyncStorage.setItem('key', 'value');
```

```tsx
// Web (via lib/store.ts - already adapted)
// Store automatically uses localStorage
// No code changes needed for components using Zustand
```

## Security Considerations

1. **Encrypted Storage**:
   - Sensitive data (auth tokens) is encrypted using crypto-js
   - Encryption key should be unique per environment
   - Change `VITE_ENCRYPTION_KEY` in production

2. **Environment Variables**:
   - Never commit `.env` file
   - Use `.env.example` as template
   - Vite requires `VITE_` prefix for exposed variables

3. **Supabase RLS**:
   - Row-Level Security policies remain unchanged
   - Same tenant isolation as mobile app
   - Web client has same permissions as mobile

## Performance Optimization Tips

1. **Code Splitting**:
   - Use React.lazy() for route-level splitting
   - Vite automatically splits chunks

2. **Bundle Size**:
   - MUI is tree-shakeable (import only what you need)
   - Tailwind purges unused CSS automatically
   - Monitor bundle size: `npm run build -- --analyze`

3. **Caching**:
   - Vite has built-in caching strategies
   - Zustand store persists to localStorage
   - Supabase client caches auth session

## Troubleshooting

### Common Issues

**Issue**: `Platform is not defined`
- **Solution**: Component still importing from 'react-native', replace with web equivalent

**Issue**: `Cannot find module 'react-native-paper'`
- **Solution**: Replace with MUI component from '@mui/material'

**Issue**: `localStorage is not defined`
- **Solution**: Check for SSR-safe code (typeof window !== 'undefined')

**Issue**: MUI styles not applying
- **Solution**: Ensure `CssBaseline` is in App.tsx and ThemeProvider wraps everything

**Issue**: Tailwind classes not working
- **Solution**: Check `tailwind.config.js` content paths include your files

## Next Steps

1. **Review this guide** and understand the migration pattern
2. **Start with Phase 2**: Migrate simple components first
3. **Test frequently**: Run `npm run dev` and test in browser
4. **Ask for help**: Reference this guide and README-WEB.md

## Contact & Resources

- **Main Documentation**: [README-WEB.md](./README-WEB.md)
- **Project Guidelines**: [CLAUDE.md](./CLAUDE.md)
- **MUI Documentation**: https://mui.com/material-ui/
- **React Router Docs**: https://reactrouter.com/
- **Vite Documentation**: https://vitejs.dev/

---

**Status**: Phase 1 Complete ✅
**Next**: Begin Phase 2 - Component Migration
**Branch**: `web-react`
