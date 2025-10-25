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
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { ArrowLeft, Save } from 'lucide-react';
import { profilesApi } from '../../../lib/api';
import { useAppStore } from '../../../lib/store';
import { Tables } from '../../../lib/database.types';

type Profile = Tables<'profiles'>;

export default function EditTenant() {
  const { t } = useTranslation(['tenants', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAppStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Profile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    nationality: '',
    id_number: '',
    is_foreign: false,
    status: 'active' as 'active' | 'inactive' | 'suspended',
  });

  useEffect(() => {
    if (id) {
      fetchTenant();
    }
  }, [id]);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await profilesApi.getById(id!);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        const tenantData = response.data;
        setTenant(tenantData);

        // Populate form with tenant data
        setFormData({
          first_name: tenantData.first_name || '',
          last_name: tenantData.last_name || '',
          email: tenantData.email || '',
          phone: tenantData.phone || '',
          address: tenantData.address || '',
          city: tenantData.city || '',
          country: tenantData.country || '',
          nationality: tenantData.nationality || '',
          id_number: tenantData.id_number || '',
          is_foreign: tenantData.is_foreign || false,
          status: (tenantData.status as any) || 'active',
        });
      } else {
        throw new Error(t('errors.notFound'));
      }
    } catch (err) {
      console.error('Error fetching tenant:', err);
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

  const handleCheckboxChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.checked });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = t('common:required');
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t('common:required');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('common:required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('common:invalidEmail');
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
        throw new Error('Tenant ID is required');
      }

      // Prepare update data
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        nationality: formData.nationality.trim() || null,
        id_number: formData.id_number.trim() || null,
        is_foreign: formData.is_foreign,
        status: formData.status,
      };

      console.log('Updating tenant:', id, updateData);

      // Update tenant
      const result = await profilesApi.update(id, updateData);

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('Tenant updated successfully:', result.data);

      // Navigate back to tenant detail
      navigate(`/dashboard/tenants/${id}`);
    } catch (err) {
      console.error('Error updating tenant:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tenant');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !tenant) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard/tenants')}>
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
          onClick={() => navigate(`/dashboard/tenants/${id}`)}
        >
          {t('common:back')}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('editTenant')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Personal Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {t('personalInfo')}
                </Typography>
                <Divider />
              </Grid>

              {/* First Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label={t('firstName')}
                  value={formData.first_name}
                  onChange={handleChange('first_name')}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  disabled={submitting}
                />
              </Grid>

              {/* Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label={t('lastName')}
                  value={formData.last_name}
                  onChange={handleChange('last_name')}
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                  disabled={submitting}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label={t('email')}
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={submitting}
                />
              </Grid>

              {/* Phone Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('phoneNumber')}
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder="+966501234567"
                  disabled={submitting}
                />
              </Grid>

              {/* Nationality */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('nationality')}
                  value={formData.nationality}
                  onChange={handleChange('nationality')}
                  disabled={submitting}
                />
              </Grid>

              {/* ID Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('idNumber')}
                  value={formData.id_number}
                  onChange={handleChange('id_number')}
                  disabled={submitting}
                />
              </Grid>

              {/* Address Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
                  {t('addressInfo')}
                </Typography>
                <Divider />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('address')}
                  value={formData.address}
                  onChange={handleChange('address')}
                  disabled={submitting}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('city')}
                  value={formData.city}
                  onChange={handleChange('city')}
                  disabled={submitting}
                />
              </Grid>

              {/* Country */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('country')}
                  value={formData.country}
                  onChange={handleChange('country')}
                  disabled={submitting}
                />
              </Grid>

              {/* Additional Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
                  {t('additionalInfo')}
                </Typography>
                <Divider />
              </Grid>

              {/* Foreign Tenant Checkbox */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_foreign}
                      onChange={handleCheckboxChange('is_foreign')}
                      disabled={submitting}
                    />
                  }
                  label={t('isForeign')}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/dashboard/tenants/${id}`)}
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
