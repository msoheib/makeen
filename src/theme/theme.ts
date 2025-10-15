import { createTheme, ThemeOptions, responsiveFontSizes } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Primary brand colors
const primaryColor = '#4C2661';
const primaryDark = '#3a1d4a';
const primaryLight = '#6a3685';
const secondaryColor = '#2196F3';

// Create responsive breakpoints
const breakpoints = {
  values: {
    xs: 0,      // Mobile portrait
    sm: 600,    // Mobile landscape / Small tablet
    md: 900,    // Tablet
    lg: 1200,   // Desktop
    xl: 1536,   // Large desktop
  },
};

// Responsive typography
const typography = {
  fontFamily: {
    default: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    arabic: "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  // Responsive font sizes
  h1: {
    fontSize: '2rem',
    '@media (min-width:600px)': {
      fontSize: '2.5rem',
    },
    '@media (min-width:900px)': {
      fontSize: '3rem',
    },
  },
  h2: {
    fontSize: '1.75rem',
    '@media (min-width:600px)': {
      fontSize: '2rem',
    },
    '@media (min-width:900px)': {
      fontSize: '2.5rem',
    },
  },
  h3: {
    fontSize: '1.5rem',
    '@media (min-width:600px)': {
      fontSize: '1.75rem',
    },
  },
  body1: {
    fontSize: '0.875rem',
    '@media (min-width:600px)': {
      fontSize: '1rem',
    },
  },
};

// Spacing configuration (8px base unit)
const spacing = 8;

// Component style overrides for better mobile UX
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        // Touch-friendly button size (minimum 44x44px)
        minHeight: '44px',
        borderRadius: '8px',
        textTransform: 'none' as const,
        fontWeight: 600,
        // Mobile: full-width buttons in xs breakpoint
        '@media (max-width:600px)': {
          fontSize: '0.875rem',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: '12px',
        // Mobile: reduce elevation for better performance
        '@media (max-width:600px)': {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        // Touch-friendly input height
        '& .MuiInputBase-root': {
          minHeight: '48px',
        },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        // Responsive drawer width
        width: '280px',
        '@media (max-width:900px)': {
          width: '100%',
          maxWidth: '280px',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        // Mobile: reduce height for more content space
        minHeight: '56px',
        '@media (min-width:600px)': {
          minHeight: '64px',
        },
      },
    },
  },
};

// Create base theme configuration
const createAppTheme = (mode: 'light' | 'dark', language: 'en' | 'ar') => {
  const isRTL = language === 'ar';

  const themeOptions: ThemeOptions = {
    direction: isRTL ? 'rtl' : 'ltr',
    breakpoints,
    spacing,
    palette: {
      mode,
      primary: {
        main: primaryColor,
        dark: primaryDark,
        light: primaryLight,
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryColor,
        light: alpha(secondaryColor, 0.8),
        dark: alpha(secondaryColor, 0.9),
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
        secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      },
      error: {
        main: '#B00020',
      },
      success: {
        main: '#4CAF50',
      },
      warning: {
        main: '#FF9800',
      },
    },
    typography: {
      fontFamily: isRTL ? typography.fontFamily.arabic : typography.fontFamily.default,
      ...typography,
    },
    components,
    // Custom shadows for cards
    shadows: [
      'none',
      '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
      '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
      ...Array(19).fill('none'),
    ] as any,
  };

  // Create theme and apply responsive font sizes
  const theme = createTheme(themeOptions);
  return responsiveFontSizes(theme);
};

export default createAppTheme;
