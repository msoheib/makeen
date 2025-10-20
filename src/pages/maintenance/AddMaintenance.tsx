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

export default function AddMaintenance() {
  const { t } = useTranslation(['maintenance', 'common']);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    propertyName: '',
    category: '',
  });

  const handleChange = (field: string) => (event: any) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual submission logic
    console.log('Form data:', formData);
    alert(t('common:success') + '! ' + t('requestCreated'));
    navigate('/dashboard/maintenance');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowLeft size={20} />}
          onClick={() => navigate('/dashboard/maintenance')}
        >
          {t('common:back')}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('newRequest')}
        </Typography>
      </Box>

      {/* Form */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label={t('title')}
                  value={formData.title}
                  onChange={handleChange('title')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  label={t('description')}
                  value={formData.description}
                  onChange={handleChange('description')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('priority')}</InputLabel>
                  <Select
                    value={formData.priority}
                    label={t('priority')}
                    onChange={handleChange('priority')}
                  >
                    <MenuItem value="low">{t('priorities.low')}</MenuItem>
                    <MenuItem value="medium">{t('priorities.medium')}</MenuItem>
                    <MenuItem value="high">{t('priorities.high')}</MenuItem>
                    <MenuItem value="urgent">{t('priorities.urgent')}</MenuItem>
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
                  >
                    <MenuItem value="pending">{t('statuses.pending')}</MenuItem>
                    <MenuItem value="approved">{t('statuses.approved')}</MenuItem>
                    <MenuItem value="inProgress">{t('statuses.inProgress')}</MenuItem>
                    <MenuItem value="completed">{t('statuses.completed')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label={t('propertyName')}
                  value={formData.propertyName}
                  onChange={handleChange('propertyName')}
                  placeholder={t('selectProperty')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('category')}
                  value={formData.category}
                  onChange={handleChange('category')}
                  placeholder={t('selectCategory')}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard/maintenance')}
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button variant="contained" type="submit">
                    {t('submitRequest')}
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
