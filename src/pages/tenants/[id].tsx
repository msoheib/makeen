import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Description as FileTextIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ResponsiveContainer from '../../components/layout/ResponsiveContainer';
import StatCard from '../../components/data/StatCard';
import { profilesApi, contractsApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { formatDate as formatGregorianDate } from '../../../lib/dateUtils';

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  role: string;
  status: string;
  is_foreign?: boolean;
  created_at: string;
  updated_at: string;
}

interface Contract {
  id: string;
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  payment_frequency: string;
  security_deposit: number;
  status: string;
  contract_number?: string;
  property?: {
    title: string;
    address: string;
    city: string;
  };
}

export default function TenantDetailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['tenants', 'common']);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch tenant details from Supabase
  const { 
    data: tenant, 
    loading: tenantLoading, 
    error: tenantError, 
    refetch: refetchTenant 
  } = useApi(() => profilesApi.getById(id || ''), [id]);

  // Fetch tenant contracts
  const { 
    data: contracts, 
    loading: contractsLoading, 
    error: contractsError, 
    refetch: refetchContracts 
  } = useApi(() => contractsApi.getByTenant(id || ''), [id]);

  // Show error message if API call fails
  useEffect(() => {
    if (tenantError) {
      setErrorMessage(tenantError);
    } else if (contractsError) {
      setErrorMessage(contractsError);
    }
  }, [tenantError, contractsError]);

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName.trim()[0] || '';
    const last = lastName.trim()[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getFullName = () => {
    if (!tenant) return 'Loading...';
    return `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return formatGregorianDate(dateString) || 'N/A';
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t('common:currency')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'suspended':
        return 'warning';
      default:
        return 'default';
    }
  };

  const activeContract = contracts?.find(c => c.status === 'active');

  // Calculate stats
  const stats = {
    totalContracts: contracts?.length || 0,
    activeContracts: contracts?.filter(c => c.status === 'active').length || 0,
    totalRent: activeContract?.rent_amount || 0,
    memberSince: tenant?.created_at ? new Date(tenant.created_at).getFullYear() : 0,
  };

  const handleRefresh = () => {
    refetchTenant();
    refetchContracts();
    setErrorMessage(null);
  };

  if (tenantLoading) {
    return (
      <ResponsiveContainer>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="40%" height={24} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="rectangular" height={200} />
          </CardContent>
        </Card>
      </ResponsiveContainer>
    );
  }

  if (tenantError && !tenant) {
    return (
      <ResponsiveContainer>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="error" gutterBottom>
            {t('tenantNotFound')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('tenantNotFoundDescription')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard/tenants')}
          >
            {t('backToTenants')}
          </Button>
        </Box>
      </ResponsiveContainer>
    );
  }

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
            {getFullName()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('tenantDetails')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={tenantLoading || contractsLoading}
            sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
          >
            {t('common:refresh')}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard/tenants')}
            sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
          >
            {t('common:back')}
          </Button>

          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/dashboard/tenants/${id}/edit`)}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {t('editTenant')}
          </Button>
        </Box>
      </Box>

      {/* Profile Header */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}05)` }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 'bold',
              }}
            >
              {getInitials(tenant?.first_name || '', tenant?.last_name || '')}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {getFullName()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {tenant?.email || t('noEmail')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={tenant?.status || 'Unknown'}
                  color={getStatusColor(tenant?.status || '') as any}
                  size="small"
                />
                {tenant?.is_foreign && (
                  <Chip
                    label={t('foreignTenant')}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
                {tenant?.nationality && (
                  <Chip
                    label={tenant.nationality}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('totalContracts')}
            value={stats.totalContracts}
            icon={<FileTextIcon />}
            color="primary"
            loading={contractsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('activeContracts')}
            value={stats.activeContracts}
            icon={<FileTextIcon />}
            color="success"
            loading={contractsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('monthlyRent')}
            value={formatCurrency(stats.totalRent)}
            icon={<HomeIcon />}
            color="info"
            loading={contractsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('memberSince')}
            value={stats.memberSince}
            icon={<CalendarIcon />}
            color="warning"
            loading={tenantLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('contactInformation')}
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('emailAddress')}
                    secondary={tenant?.email || t('notProvided')}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('phoneNumber')}
                    secondary={tenant?.phone || t('notProvided')}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <LocationIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('address')}
                    secondary={tenant?.address || t('notProvided')}
                  />
                </ListItem>

                {tenant?.nationality && (
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('nationality')}
                      secondary={tenant.nationality}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Property */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('currentProperty')}
              </Typography>

              {activeContract ? (
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <HomeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={activeContract.property?.title || t('propertyName')}
                      secondary={`${activeContract.property?.address || ''}, ${activeContract.property?.city || ''}`}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <FileTextIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('monthlyRent')}
                      secondary={formatCurrency(activeContract.rent_amount)}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('contractPeriod')}
                      secondary={`${formatDate(activeContract.start_date)} - ${formatDate(activeContract.end_date)}`}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <FileTextIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('contractNumber')}
                      secondary={activeContract.contract_number || t('notAssigned')}
                    />
                  </ListItem>
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <HomeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    {t('noActiveContract')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Contract History */}
        {contracts && contracts.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  {t('contractHistory')}
                </Typography>

                <List>
                  {contracts.map((contract, index) => (
                    <Box key={contract.id}>
                      <ListItem>
                        <ListItemIcon>
                          <FileTextIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${t('contract')} ${contract.contract_number || `#${index + 1}`}`}
                          secondary={`${formatDate(contract.start_date)} - ${formatDate(contract.end_date)}`}
                        />
                        <Chip
                          label={contract.status}
                          color={contract.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </ListItem>
                      {index < contracts.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Account Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('accountDetails')}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('tenantID')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {tenant?.id || t('notAvailable')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('role')}
                  </Typography>
                  <Typography variant="body1">
                    {tenant?.role || t('notAvailable')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('status')}
                  </Typography>
                  <Chip
                    label={tenant?.status || 'Unknown'}
                    color={getStatusColor(tenant?.status || '') as any}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('memberSince')}
                  </Typography>
                  <Typography variant="body1">
                    {tenant?.created_at ? formatDate(tenant.created_at) : t('notAvailable')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ResponsiveContainer>
  );
}
