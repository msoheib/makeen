import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Build as MaintenanceIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ResponsiveContainer from '../../components/layout/ResponsiveContainer';
import { maintenanceApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { formatDate } from '../../../lib/dateUtils';

const statusColors = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
} as const;

const priorityColors = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  urgent: 'error',
} as const;

export default function MaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation(['maintenance', 'common']);

  const { data: request, loading, error } = useApi(
    async () => {
      if (!id) throw new Error('No maintenance request ID provided');
      const response = await maintenanceApi.getById(id);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    [id]
  );

  if (loading) {
    return (
      <ResponsiveContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </ResponsiveContainer>
    );
  }

  if (error || !request) {
    return (
      <ResponsiveContainer>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || t('common:somethingWentWrong')}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/maintenance')}
        >
          {t('common:back')}
        </Button>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/maintenance')}
          variant="outlined"
        >
          {t('common:back')}
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {request.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('requestID')}: {request.id}
          </Typography>
        </Box>
        <Button
          startIcon={<EditIcon />}
          variant="contained"
          onClick={() => navigate(`/dashboard/maintenance/${id}/edit`)}
        >
          {t('common:edit')}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={t(`status.${request.status}`)}
                  color={statusColors[request.status as keyof typeof statusColors]}
                  size="small"
                />
                <Chip
                  label={t(`priority.${request.priority}`)}
                  color={priorityColors[request.priority as keyof typeof priorityColors]}
                  size="small"
                />
              </Box>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('description')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {request.description || t('noDescription')}
              </Typography>

              <Divider sx={{ my: 3 }} />

              {/* Images */}
              {request.images && request.images.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {t('images')}
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {request.images.map((image: string, index: number) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box
                          component="img"
                          src={image}
                          alt={`${request.title} - ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                  <Divider sx={{ my: 3 }} />
                </>
              )}

              {/* Notes */}
              {request.notes && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {t('notes')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {request.notes}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('details')}
              </Typography>

              {/* Property */}
              {request.property && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <HomeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t('property')}
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {request.property.title}
                  </Typography>
                </Box>
              )}

              {/* Tenant */}
              {request.tenant && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t('tenant')}
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {request.tenant.first_name} {request.tenant.last_name}
                  </Typography>
                </Box>
              )}

              {/* Created Date */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {t('createdAt')}
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {formatDate(request.created_at)}
                </Typography>
              </Box>

              {/* Updated Date */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {t('lastUpdated')}
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {formatDate(request.updated_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ResponsiveContainer>
  );
}
