import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useEffect, useMemo } from 'react';

// Import i18n setup
import '../lib/i18n';

// Store imports
import { useAppStore } from '../lib/store';

// Theme
import createAppTheme from './theme/theme';

// Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  const { isHydrated, isDarkMode, currentLanguage } = useAppStore();

  // Create responsive theme with memo for performance
  const theme = useMemo(
    () => createAppTheme(isDarkMode ? 'dark' : 'light', currentLanguage as 'en' | 'ar'),
    [isDarkMode, currentLanguage]
  );

  // Update document direction for RTL
  useEffect(() => {
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  // Wait for store hydration
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard/*" element={<DashboardLayout />} />

          {/* Redirect root to login or dashboard */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />

          {/* 404 Catch-all */}
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
