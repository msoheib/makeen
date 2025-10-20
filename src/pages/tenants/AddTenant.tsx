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
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';

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

  const handleChange = (field: string) => (event: any) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleCheckboxChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.checked });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual submission logic
    console.log('Form data:', formData);
    alert(t('common:success') + '! ' + t('tenantAdded'));
    navigate('/dashboard/tenants');
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
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('address')}
                  value={formData.address}
                  onChange={handleChange('address')}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('city')}
                  value={formData.city}
                  onChange={handleChange('city')}
                />
              </Grid>

              {/* Country */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('country')}
                  value={formData.country}
                  onChange={handleChange('country')}
                />
              </Grid>

              {/* Nationality */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('nationality')}
                  value={formData.nationality}
                  onChange={handleChange('nationality')}
                />
              </Grid>

              {/* ID Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('idNumber')}
                  value={formData.id_number}
                  onChange={handleChange('id_number')}
                />
              </Grid>

              {/* Foreign Tenant Checkbox */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_foreign}
                      onChange={handleCheckboxChange('is_foreign')}
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
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button variant="contained" type="submit">
                    {t('addTenant')}
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
