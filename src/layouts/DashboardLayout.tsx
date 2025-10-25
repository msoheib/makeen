import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import ResponsiveAppBar from '../components/navigation/ResponsiveAppBar';
import ResponsiveSidebar from '../components/navigation/ResponsiveSidebar';
import DashboardHome from '../pages/dashboard/DashboardHome';
import PropertiesList from '../pages/properties/PropertiesList';
import AddProperty from '../pages/properties/AddProperty';
import PropertyDetail from '../pages/properties/PropertyDetail';
import EditProperty from '../pages/properties/EditProperty';
import TenantsList from '../pages/tenants/TenantsList';
import AddTenant from '../pages/tenants/AddTenant';
import TenantDetail from '../pages/tenants/[id]';
import EditTenant from '../pages/tenants/EditTenant';
import MaintenanceList from '../pages/maintenance/MaintenanceList';
import AddMaintenance from '../pages/maintenance/AddMaintenance';
import MaintenanceDetail from '../pages/maintenance/MaintenanceDetail';
import VouchersList from '../pages/finance/VouchersList';
import InvoicesList from '../pages/finance/InvoicesList';
import ReportsList from '../pages/reports/ReportsList';
import SettingsPage from '../pages/settings/SettingsPage';
import ProfilePage from '../pages/profile/index';
import BuildingsList from '../pages/buildings/BuildingsList';
import AddBuilding from '../pages/buildings/AddBuilding';
import BuildingDetail from '../pages/buildings/BuildingDetail';

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isAuthenticated, setUser, setAuthenticated, isHydrated, user } = useAppStore();

  console.log('[DashboardLayout] Component render - State:', {
    isHydrated,
    isAuthenticated,
    hasUser: !!user,
    userEmail: user?.email,
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Only check auth once when hydrated
    if (!isHydrated || authChecked) return;

    // Check authentication status
    const checkAuth = async () => {
      console.log('[DashboardLayout] Checking authentication...');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log('[DashboardLayout] No session found, redirecting to login');
        navigate('/auth/login');
        return;
      }

      // If user is already in store and authenticated, skip profile fetch
      if (isAuthenticated && user) {
        console.log('[DashboardLayout] User already authenticated:', user.email);
        setAuthChecked(true);
        return;
      }

      // Fetch user profile
      console.log('[DashboardLayout] Fetching user profile...');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('[DashboardLayout] Error fetching profile:', error);
        navigate('/auth/login');
        return;
      }

      if (!profile) {
        console.error('[DashboardLayout] No profile found');
        navigate('/auth/login');
        return;
      }

      console.log('[DashboardLayout] Profile loaded:', {
        email: profile.email,
        role: profile.role,
        approval_status: profile.approval_status,
        status: profile.status,
      });

      // Validate approval and account status for web routing guard
      const isApproved = profile.approval_status === 'approved';
      const isActive = profile.status !== 'inactive' && profile.status !== 'suspended';

      if (!isApproved || !isActive) {
        console.warn('[DashboardLayout] Account not approved or inactive:', {
          isApproved,
          isActive,
          approval_status: profile.approval_status,
          status: profile.status,
        });
        navigate('/auth/login');
        return;
      }

      console.log('[DashboardLayout] Authentication successful');
      setUser(profile);
      setAuthenticated(true);
      setAuthChecked(true);
    };

    checkAuth();
  }, [isHydrated, authChecked]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Wait for hydration and authentication
  if (!isHydrated || !isAuthenticated) {
    console.log('[DashboardLayout] Showing loader:', { isHydrated, isAuthenticated });
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

  console.log('[DashboardLayout] Rendering dashboard UI');

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
          minHeight: '100vh',
          width: 0, // Force flex item to respect container width
          pt: { xs: 'calc(56px + 16px)', sm: 'calc(64px + 24px)' }, // AppBar height + spacing
          pb: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3, md: 4 },
          overflow: 'auto', // Allow scrolling if content exceeds
        }}
      >
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="properties" element={<PropertiesList />} />
          <Route path="properties/add" element={<AddProperty />} />
          <Route path="properties/:id" element={<PropertyDetail />} />
          <Route path="properties/:id/edit" element={<EditProperty />} />
          <Route path="buildings" element={<BuildingsList />} />
          <Route path="buildings/add" element={<AddBuilding />} />
          <Route path="buildings/:id" element={<BuildingDetail />} />
          <Route path="tenants" element={<TenantsList />} />
          <Route path="tenants/add" element={<AddTenant />} />
          <Route path="tenants/:id" element={<TenantDetail />} />
          <Route path="tenants/:id/edit" element={<EditTenant />} />
          <Route path="maintenance" element={<MaintenanceList />} />
          <Route path="maintenance/add" element={<AddMaintenance />} />
          <Route path="maintenance/:id" element={<MaintenanceDetail />} />
          <Route path="finance/vouchers" element={<VouchersList />} />
          <Route path="finance/invoices" element={<InvoicesList />} />
          <Route path="reports" element={<ReportsList />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Routes>
      </Box>
    </Box>
  );
}
