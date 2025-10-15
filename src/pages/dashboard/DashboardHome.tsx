import { useEffect, useState } from 'react';
import { Box, Typography, Grid, useTheme, useMediaQuery } from '@mui/material';
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
  const { t } = useTranslation();
  const { user } = useAppStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard stats
    // In production, this would fetch from Supabase
    const loadStats = async () => {
      setLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStats({
        totalProperties: 45,
        occupiedProperties: 38,
        totalTenants: 42,
        pendingMaintenance: 7,
        monthlyRevenue: 125000,
        occupancyRate: 84,
      });

      setLoading(false);
    };

    loadStats();
  }, []);

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
          {t('dashboard.welcome', { name: user?.first_name })}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          {t('dashboard.subtitle')}
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
              title={t('dashboard.totalProperties')}
              value={stats?.totalProperties || 0}
              icon={<HomeIcon />}
              color="primary"
              trend={{
                value: 5.2,
                isPositive: true,
              }}
            />
          )}
        </Grid>

        {/* Occupied Properties */}
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={t('dashboard.occupied')}
              value={stats?.occupiedProperties || 0}
              icon={<HomeIcon />}
              color="success"
              trend={{
                value: 2.1,
                isPositive: true,
              }}
            />
          )}
        </Grid>

        {/* Total Tenants */}
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={t('dashboard.totalTenants')}
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
              title={t('dashboard.pendingMaintenance')}
              value={stats?.pendingMaintenance || 0}
              icon={<MaintenanceIcon />}
              color="warning"
              trend={{
                value: -15,
                isPositive: true, // Negative number is good for maintenance requests
              }}
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
              title={t('dashboard.monthlyRevenue')}
              value={`SAR ${stats?.monthlyRevenue.toLocaleString() || 0}`}
              icon={<MoneyIcon />}
              color="success"
              trend={{
                value: 12.5,
                isPositive: true,
              }}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={t('dashboard.occupancyRate')}
              value={`${stats?.occupancyRate || 0}%`}
              icon={<HomeIcon />}
              color="primary"
              trend={{
                value: 3.2,
                isPositive: true,
              }}
            />
          )}
        </Grid>
      </Grid>

      {/* Welcome Message */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: { xs: 2, sm: 3, md: 4 },
          boxShadow: 1,
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          {t('dashboard.gettingStarted')}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t('dashboard.description')}
        </Typography>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            📱 <strong>Responsive Design:</strong> This interface adapts seamlessly across mobile, tablet, and desktop devices.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            🌍 <strong>Multi-language Support:</strong> Switch between English and Arabic using the language toggle in the top bar.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            🎨 <strong>Dark Mode:</strong> Toggle dark mode for comfortable viewing in any lighting condition.
          </Typography>
        </Box>
      </Box>
    </ResponsiveContainer>
  );
}
