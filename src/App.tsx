import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useEffect } from 'react';

// Import i18n setup
import '../lib/i18n';

// Store imports
import { useAppStore } from '../lib/store';

// Placeholder components (will be created later)
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  const { isHydrated, isDarkMode, currentLanguage } = useAppStore();

  // Create MUI theme based on dark mode preference
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#4C2661',
        dark: '#3a1d4a',
        light: '#6a3685',
      },
      secondary: {
        main: '#2196F3',
      },
    },
    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
    typography: {
      fontFamily: currentLanguage === 'ar' ? 'Cairo, sans-serif' : 'Inter, sans-serif',
    },
  });

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
