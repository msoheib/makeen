import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase.web';
import ResponsiveAppBar from '../components/navigation/ResponsiveAppBar';
import ResponsiveSidebar from '../components/navigation/ResponsiveSidebar';
import DashboardHome from '../pages/dashboard/DashboardHome';

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isAuthenticated, setUser, setAuthenticated, isHydrated } = useAppStore();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/auth/login');
        return;
      }

      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile || profile.status !== 'approved') {
        navigate('/auth/login');
        return;
      }

      setUser(profile);
      setAuthenticated(true);
    };

    if (isHydrated) {
      checkAuth();
    }
  }, [isHydrated, navigate, setUser, setAuthenticated]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Wait for hydration and authentication
  if (!isHydrated || !isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <ResponsiveAppBar
        onMenuClick={handleDrawerToggle}
        showMenuButton={isMobile}
      />

      {/* Sidebar */}
      <ResponsiveSidebar
        open={mobileOpen}
        onClose={handleDrawerToggle}
      />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${280}px)` },
          minHeight: '100vh',
          pt: { xs: '56px', sm: '64px' }, // Account for AppBar height
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          ml: { md: '280px' }, // Account for permanent drawer on desktop
        }}
      >
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          {/* More routes will be added here */}
        </Routes>
      </Box>
    </Box>
  );
}
