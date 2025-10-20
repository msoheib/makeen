import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ResponsiveContainer from '../../components/layout/ResponsiveContainer';
import StatCard from '../../components/data/StatCard';
import { profilesApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  profile_type?: string;
  nationality?: string;
  is_foreign?: boolean;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  active: 'success',
  inactive: 'default',
  suspended: 'error',
} as const;

export default function TenantsList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { t } = useTranslation(['tenants', 'common']);

  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch tenants from Supabase
  const { 
    data: tenants, 
    loading, 
    error, 
    refetch 
  } = useApi(() => profilesApi.getAll({
    role: 'tenant',
    profile_type: 'tenant'
  }), []);

  // Show error message if API call fails
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  // Filter tenants
  const filteredTenants = (tenants || []).filter((tenant) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tenant.first_name?.toLowerCase().includes(searchLower) ||
      tenant.last_name?.toLowerCase().includes(searchLower) ||
      tenant.email?.toLowerCase().includes(searchLower) ||
      tenant.phone?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const stats = {
    total: tenants?.length || 0,
    active: tenants?.filter((t) => t.status === 'active').length || 0,
    inactive: tenants?.filter((t) => t.status === 'inactive').length || 0,
    foreign: tenants?.filter((t) => t.is_foreign).length || 0,
  };

  return (
    <ResponsiveContainer>
      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setErrorMessage(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            {t('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('subtitle')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refetch}
            disabled={loading}
            sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
          >
            {t('common:refresh')}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/dashboard/tenants/add')}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {t('add.title')}
          </Button>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('totalTenants')}
            value={stats.total}
            icon={<PersonIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('activeTenants')}
            value={stats.active}
            icon={<PersonIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('inactiveTenants')}
            value={stats.inactive}
            icon={<PersonIcon />}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('foreignTenants')}
            value={stats.foreign}
            icon={<PersonIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredTenants.length} {t('common:found')}
      </Typography>

      {/* Tenants Grid */}
      {loading ? (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Skeleton variant="circular" width={56} height={56} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={24} />
                      <Skeleton variant="text" width="40%" height={20} />
                    </Box>
                  </Box>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="70%" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredTenants.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
          }}
        >
          <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('noTenantsFound')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? t('adjustSearch') : t('addFirstTenant')}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {filteredTenants.map((tenant) => (
            <Grid item xs={12} sm={6} md={4} key={tenant.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={() => navigate(`/dashboard/tenants/${tenant.id}`)}
              >
                <CardContent>
                  {/* Header with Avatar and Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'primary.main',
                        fontSize: '1.25rem',
                      }}
                    >
                      {tenant.first_name[0]}
                      {tenant.last_name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        {tenant.first_name} {tenant.last_name}
                      </Typography>
                      <Chip
                        label={t(`${tenant.status}Status`)}
                        color={statusColors[tenant.status]}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  {/* Contact Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      {tenant.email}
                    </Typography>
                  </Box>

                  {tenant.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {tenant.phone}
                      </Typography>
                    </Box>
                  )}

                  {/* Additional Info */}
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    {tenant.nationality && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {t('nationality')}: {tenant.nationality}
                      </Typography>
                    )}
                    
                    {tenant.is_foreign && (
                      <Chip
                        label={t('foreignTenant')}
                        size="small"
                        color="info"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </ResponsiveContainer>
  );
}
