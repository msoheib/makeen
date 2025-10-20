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
  Chip,
  useTheme,
  useMediaQuery,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Build as MaintenanceIcon,
  PriorityHigh as PriorityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ResponsiveContainer from '../../components/layout/ResponsiveContainer';
import StatCard from '../../components/data/StatCard';
import { maintenanceApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { formatDate } from '../../../lib/dateUtils';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  property_id: string;
  tenant_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  images?: string[];
}

const priorityColors = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  urgent: 'error',
} as const;

const statusColors = {
  pending: 'warning',
  approved: 'info',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'default',
} as const;

export default function MaintenanceList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { t } = useTranslation(['maintenance', 'common']);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch maintenance requests from Supabase
  const { 
    data: requests, 
    loading, 
    error, 
    refetch 
  } = useApi(() => maintenanceApi.getRequests({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
  }), [statusFilter, priorityFilter]);

  // Show error message if API call fails
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  // Filter requests
  const filteredRequests = (requests || []).filter((request) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      request.title.toLowerCase().includes(searchLower) ||
      request.description.toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === 'pending').length || 0,
    inProgress: requests?.filter((r) => r.status === 'in_progress').length || 0,
    completed: requests?.filter((r) => r.status === 'completed').length || 0,
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
            onClick={() => navigate('/dashboard/maintenance/add')}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {t('addRequest')}
          </Button>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('totalRequestsStat')}
            value={stats.total}
            icon={<MaintenanceIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('pendingStat')}
            value={stats.pending}
            icon={<MaintenanceIcon />}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('inProgressStat')}
            value={stats.inProgress}
            icon={<MaintenanceIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('completedStat')}
            value={stats.completed}
            icon={<MaintenanceIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {/* Search */}
          <Grid item xs={12} md={6}>
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
          </Grid>

          {/* Status Filter */}
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('filterByStatus')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('filterByStatus')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">{t('common:all')}</MenuItem>
                <MenuItem value="pending">{t('statuses.pending')}</MenuItem>
                <MenuItem value="approved">{t('statuses.approved')}</MenuItem>
                <MenuItem value="inProgress">{t('statuses.inProgress')}</MenuItem>
                <MenuItem value="completed">{t('statuses.completed')}</MenuItem>
                <MenuItem value="cancelled">{t('statuses.cancelled')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Priority Filter */}
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('filterByPriority')}</InputLabel>
              <Select
                value={priorityFilter}
                label={t('filterByPriority')}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="all">{t('common:all')}</MenuItem>
                <MenuItem value="low">{t('priorities.low')}</MenuItem>
                <MenuItem value="medium">{t('priorities.medium')}</MenuItem>
                <MenuItem value="high">{t('priorities.high')}</MenuItem>
                <MenuItem value="urgent">{t('priorities.urgent')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredRequests.length} {t('common:found')}
      </Typography>

      {/* Requests Grid */}
      {loading ? (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="70%" height={20} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="rectangular" width={80} height={24} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredRequests.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
          }}
        >
          <MaintenanceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('noMaintenanceRequests')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? t('adjustSearchOrFilters')
              : t('addFirstRequest')}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {filteredRequests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request.id}>
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
                onClick={() => navigate(`/dashboard/maintenance/${request.id}`)}
              >
                <CardContent>
                  {/* Title */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {request.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {request.description}
                  </Typography>

                  {/* Property ID */}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Property ID: {request.property_id}
                  </Typography>

                  {/* Badges */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={t(`statuses.${request.status}`)}
                      color={statusColors[request.status]}
                      size="small"
                    />
                    <Chip
                      label={t(`priorities.${request.priority}`)}
                      color={priorityColors[request.priority]}
                      size="small"
                      icon={<PriorityIcon fontSize="small" />}
                    />
                  </Box>

                  {/* Footer */}
                  <Box
                    sx={{
                      pt: 2,
                      borderTop: 1,
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.created_at)}
                    </Typography>
                    {request.images && request.images.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {request.images.length} image{request.images.length > 1 ? 's' : ''}
                      </Typography>
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
