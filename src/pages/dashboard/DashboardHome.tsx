import { useEffect, useState } from 'react';
import { Box, Typography, Grid, useTheme, useMediaQuery, Snackbar, Alert } from '@mui/material';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  Build as MaintenanceIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../../lib/store';
import StatCard, { StatCardSkeleton } from '../../components/data/StatCard';
import ResponsiveContainer from '../../components/layout/ResponsiveContainer';
import { propertiesApi, profilesApi, maintenanceApi } from '../../../lib/api';

interface DashboardStats {
  totalProperties: number;
  occupiedProperties: number;
  totalTenants: number;
  pendingMaintenance: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

export default function DashboardHome() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation('dashboard');
  const { user } = useAppStore();

  console.log('[DashboardHome] Rendering, user:', user?.email);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);

        // Fetch core counts in parallel
        const [summaryRes, tenantsRes, maintenanceRes] = await Promise.all([
          propertiesApi.getDashboardSummary(),
          profilesApi.getAll({ role: 'tenant' }),
          maintenanceApi.getRequests({ status: 'pending' })
        ]);

        if (summaryRes.error) throw new Error(summaryRes.error.message);
        if (tenantsRes.error) throw new Error(tenantsRes.error.message);
        if (maintenanceRes.error) throw new Error(maintenanceRes.error.message);

        const summary = summaryRes.data || {
          total_properties: 0,
          available: 0,
          occupied: 0,
          maintenance: 0,
          total_monthly_rent: 0,
          active_contracts: 0,
        };

        const totalProperties = Number(summary.total_properties) || 0;
        const occupied = Number(summary.occupied) || 0;
        const monthlyRevenue = Number(summary.total_monthly_rent) || 0;
        const pendingMaintenance = (maintenanceRes.data || []).length;
        const totalTenants = (tenantsRes.data || []).length;
        const occupancyRate = totalProperties > 0 ? Math.round((occupied / totalProperties) * 100) : 0;

        setStats({
          totalProperties,
          occupiedProperties: occupied,
          totalTenants,
          pendingMaintenance,
          monthlyRevenue,
          occupancyRate,
        });
      } catch (err) {
        console.error('[Dashboard] loadStats error:', err);
        setErrorMessage(err instanceof Error ? err.message : t('common:somethingWentWrong'));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [t]);

  return (
    <ResponsiveContainer>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          }}
        >
          {t('welcome', { name: user?.first_name })}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          {t('subtitle')}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {/* Total Properties */}
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={t('totalProperties')}
              value={stats?.totalProperties || 0}
              icon={<HomeIcon />}
              color="primary"
            />
          )}
        </Grid>

        {/* Occupied Properties */}
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={t('occupied')}
              value={stats?.occupiedProperties || 0}
              icon={<HomeIcon />}
              color="success"
            />
          )}
        </Grid>

        {/* Total Tenants */}
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={t('totalTenants')}
              value={stats?.totalTenants || 0}
              icon={<PeopleIcon />}
              color="info"
            />
          )}
        </Grid>

        {/* Pending Maintenance */}
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={t('pendingMaintenance')}
              value={stats?.pendingMaintenance || 0}
              icon={<MaintenanceIcon />}
              color="warning"
            />
          )}
        </Grid>
      </Grid>

      {/* Financial Stats */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={12} md={6}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={t('monthlyRevenue')}
              value={`${stats?.monthlyRevenue.toLocaleString() || 0} ${t('common:currency')}`}
              icon={<MoneyIcon />}
              color="success"
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={t('occupancyRate')}
              value={`${stats?.occupancyRate || 0}%`}
              icon={<HomeIcon />}
              color="primary"
            />
          )}
        </Grid>
      </Grid>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage(null)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </ResponsiveContainer>
  );
}
