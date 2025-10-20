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
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';

export default function AddTenant() {
  const { t } = useTranslation(['tenants', 'common']);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active',
    propertyId: '',
    nationality: '',
    idNumber: '',
  });

  const handleChange = (field: string) => (event: any) => {
    setFormData({ ...formData, [field]: event.target.value });
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label={t('firstName')}
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label={t('lastName')}
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                />
              </Grid>

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

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label={t('phoneNumber')}
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder="+966501234567"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('nationality')}
                  value={formData.nationality}
                  onChange={handleChange('nationality')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('idNumber')}
                  value={formData.idNumber}
                  onChange={handleChange('idNumber')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('status')}</InputLabel>
                  <Select
                    value={formData.status}
                    label={t('status')}
                    onChange={handleChange('status')}
                  >
                    <MenuItem value="active">{t('statusOptions.active')}</MenuItem>
                    <MenuItem value="pending">{t('statusOptions.pending')}</MenuItem>
                    <MenuItem value="inactive">{t('statusOptions.inactive')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('propertyName')}
                  value={formData.propertyId}
                  onChange={handleChange('propertyId')}
                  placeholder={t('selectProperty')}
                />
              </Grid>

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
