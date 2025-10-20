import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { createTenantComplete } from '../../../lib/tenantCreation';
import { supabase } from '../../../lib/supabase';

export default function AddTenant() {
  const { t } = useTranslation(['tenants', 'common']);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    role: 'tenant',
    address: '',
    city: '',
    country: '',
    nationality: '',
    id_number: '',
    is_foreign: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = t('common:required');
    }

    if (!formData.password) {
      newErrors.password = t('common:required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('common:passwordTooShort');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('common:required');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('common:passwordsDoNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Check for duplicate email
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formData.email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        setErrors({ email: t('common:emailAlreadyExists') });
        setSubmitError(t('common:emailAlreadyExists'));
        setLoading(false);
        return;
      }

      // Create tenant account
      const result = await createTenantComplete({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone_number.trim() || undefined,
        role: formData.role,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined,
        nationality: formData.nationality.trim() || undefined,
        id_number: formData.id_number.trim() || undefined,
        is_foreign: formData.is_foreign,
      });

      if (!result.success) {
        setSubmitError(result.error || t('common:error'));
        setLoading(false);
        return;
      }

      // Success!
      alert(t('common:success') + '! ' + t('tenantAdded'));
      navigate('/dashboard/tenants');
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      setSubmitError(error.message || t('common:error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowLeft size={20} />}
          onClick={() => navigate('/dashboard/tenants')}
        >
          {t('common:back')}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('addTenant')}
        </Typography>
      </Box>

      {/* Form */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </Grid>

              {/* Phone Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label={t('phoneNumber')}
                  value={formData.phone_number}
                  onChange={handleChange('phone_number')}
                  placeholder="+966501234567"
                  error={!!errors.phone_number}
                  helperText={errors.phone_number}
                  disabled={loading}
                />
              </Grid>

              {/* Password */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="password"
                  label={t('password')}
                  value={formData.password}
                  onChange={handleChange('password')}
                  error={!!errors.password}
                  helperText={errors.password}
                  disabled={loading}
                />
              </Grid>

              {/* Confirm Password */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="password"
                  label={t('confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  disabled={loading}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('address')}
                  value={formData.address}
                  onChange={handleChange('address')}
                  disabled={loading}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('city')}
                  value={formData.city}
                  onChange={handleChange('city')}
                  disabled={loading}
                />
              </Grid>

              {/* Country */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('country')}
                  value={formData.country}
                  onChange={handleChange('country')}
                  disabled={loading}
                />
              </Grid>

              {/* Nationality */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('nationality')}
                  value={formData.nationality}
                  onChange={handleChange('nationality')}
                  disabled={loading}
                />
              </Grid>

              {/* ID Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('idNumber')}
                  value={formData.id_number}
                  onChange={handleChange('id_number')}
                  disabled={loading}
                />
              </Grid>

              {/* Foreign Tenant Checkbox */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_foreign}
                      onChange={handleCheckboxChange('is_foreign')}
                      disabled={loading}
                    />
                  }
                  label={t('isForeign')}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard/tenants')}
                    disabled={loading}
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {loading ? t('common:creating') : t('addTenant')}
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
