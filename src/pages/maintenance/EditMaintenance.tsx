import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { maintenanceApi } from '../../../lib/api';
import { useAppStore } from '../../../lib/store';
import { Tables } from '../../../lib/database.types';

type MaintenanceRequest = Tables<'maintenance_requests'>;

export default function EditMaintenance() {
  const { t } = useTranslation(['maintenance', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAppStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceRequest, setMaintenanceRequest] = useState<any | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    estimated_cost: '',
    actual_cost: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchMaintenanceRequest();
    }
  }, [id]);

  const fetchMaintenanceRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await maintenanceApi.getById(id!);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        const request = response.data;
        setMaintenanceRequest(request);

        // Populate form with maintenance request data
        setFormData({
          title: request.title || '',
          description: request.description || '',
          priority: (request.priority as any) || 'medium',
          status: (request.status as any) || 'pending',
          estimated_cost: request.estimated_cost?.toString() || '',
          actual_cost: request.actual_cost?.toString() || '',
          notes: request.notes || '',
        });
      } else {
        throw new Error(t('errors.notFound'));
      }
    } catch (err) {
      console.error('Error fetching maintenance request:', err);
      setError(err instanceof Error ? err.message : t('errors.generalError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (event: any) => {
    setFormData({ ...formData, [field]: event.target.value });
    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('common:required');
    } else if (formData.title.trim().length < 5) {
      newErrors.title = t('common:minLength', { length: 5 });
    }

    if (!formData.description.trim()) {
      newErrors.description = t('common:required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!validateForm()) {
      setSubmitting(false);
      return;
    }

    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      if (!id) {
        throw new Error('Maintenance request ID is required');
      }

      // Prepare update data
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : null,
        notes: formData.notes.trim() || null,
      };

      console.log('Updating maintenance request:', id, updateData);

      // Update maintenance request
      const result = await maintenanceApi.updateRequest(id, updateData);

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('Maintenance request updated successfully:', result.data);

      // Navigate back to maintenance detail
      navigate(`/dashboard/maintenance/${id}`);
    } catch (err) {
      console.error('Error updating maintenance request:', err);
      setError(err instanceof Error ? err.message : 'Failed to update maintenance request');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string): 'default' | 'primary' | 'warning' | 'error' => {
    switch (priority) {
      case 'low': return 'default';
      case 'medium': return 'primary';
      case 'high': return 'warning';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !maintenanceRequest) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard/maintenance')}>
          {t('common:back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowLeft size={20} />}
          onClick={() => navigate(`/dashboard/maintenance/${id}`)}
        >
          {t('common:back')}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('editRequest')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Property Info */}
      {maintenanceRequest?.property && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('property')}
            </Typography>
            <Typography variant="h6">
              {maintenanceRequest.property.title}
            </Typography>
            {maintenanceRequest.property.address && (
              <Typography variant="body2" color="text.secondary">
                {maintenanceRequest.property.address}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Request Details */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {t('requestDetails')}
                </Typography>
                <Divider />
              </Grid>

              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label={t('title')}
                  value={formData.title}
                  onChange={handleChange('title')}
                  error={!!errors.title}
                  helperText={errors.title}
                  disabled={submitting}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  label={t('description')}
                  value={formData.description}
                  onChange={handleChange('description')}
                  error={!!errors.description}
                  helperText={errors.description}
                  disabled={submitting}
                />
              </Grid>

              {/* Priority and Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('priority')}</InputLabel>
                  <Select
                    value={formData.priority}
                    label={t('priority')}
                    onChange={handleChange('priority')}
                    disabled={submitting}
                  >
                    <MenuItem value="low">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={t('priorities.low')} size="small" color={getPriorityColor('low')} />
                      </Box>
                    </MenuItem>
                    <MenuItem value="medium">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={t('priorities.medium')} size="small" color={getPriorityColor('medium')} />
                      </Box>
                    </MenuItem>
                    <MenuItem value="high">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={t('priorities.high')} size="small" color={getPriorityColor('high')} />
                      </Box>
                    </MenuItem>
                    <MenuItem value="urgent">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AlertTriangle size={16} />
                        <Chip label={t('priorities.urgent')} size="small" color={getPriorityColor('urgent')} />
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('status')}</InputLabel>
                  <Select
                    value={formData.status}
                    label={t('status')}
                    onChange={handleChange('status')}
                    disabled={submitting}
                  >
                    <MenuItem value="pending">
                      <Chip label={t('statuses.pending')} size="small" color={getStatusColor('pending')} />
                    </MenuItem>
                    <MenuItem value="in_progress">
                      <Chip label={t('statuses.in_progress')} size="small" color={getStatusColor('in_progress')} />
                    </MenuItem>
                    <MenuItem value="completed">
                      <Chip label={t('statuses.completed')} size="small" color={getStatusColor('completed')} />
                    </MenuItem>
                    <MenuItem value="cancelled">
                      <Chip label={t('statuses.cancelled')} size="small" color={getStatusColor('cancelled')} />
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Cost Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
                  {t('costInformation')}
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('estimatedCost')}
                  value={formData.estimated_cost}
                  onChange={handleChange('estimated_cost')}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  disabled={submitting}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('actualCost')}
                  value={formData.actual_cost}
                  onChange={handleChange('actual_cost')}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  disabled={submitting}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
                  {t('additionalNotes')}
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('notes')}
                  value={formData.notes}
                  onChange={handleChange('notes')}
                  disabled={submitting}
                  placeholder={t('notesPlaceholder')}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/dashboard/maintenance/${id}`)}
                    disabled={submitting}
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save size={20} />}
                    disabled={submitting}
                  >
                    {submitting ? <CircularProgress size={20} /> : t('common:save')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
