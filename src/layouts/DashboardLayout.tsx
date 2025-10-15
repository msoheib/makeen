import { useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase.web';

// Placeholder dashboard component
function Dashboard() {
  const { user } = useAppStore();

  return (
    <Box sx={{ p: 3 }}>
      <h1>Welcome to Makeen Property Management System</h1>
      <p>User: {user?.first_name} {user?.last_name}</p>
      <p>Role: {user?.role}</p>
      <p>Status: {user?.status}</p>

      <Box sx={{ mt: 4 }}>
        <h2>Web Version - Coming Soon!</h2>
        <p>This is the ReactJS web branch of the property management system.</p>
        <p>Core features are being migrated from React Native to pure React.</p>
      </Box>
    </Box>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, setUser, setAuthenticated, isHydrated } = useAppStore();

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

  // Wait for hydration and authentication
  if (!isHydrated || !isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar navigation will go here */}

      {/* Main content area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* More routes will be added here */}
        </Routes>
      </Box>
    </Box>
  );
}
