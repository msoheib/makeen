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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowLeft, Save } from 'lucide-react';
import { propertiesApi } from '../../../lib/api';
import { useAppStore } from '../../../lib/store';
import { Tables } from '../../../lib/database.types';

type Property = Tables<'properties'>;

export default function EditProperty() {
  const { t } = useTranslation(['properties', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAppStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    property_type: 'apartment' as 'apartment' | 'villa' | 'office' | 'retail' | 'warehouse',
    status: 'available' as 'available' | 'rented' | 'maintenance',
    price: '',
    annual_rent: '',
    city: '',
    address: '',
    country: 'Saudi Arabia',
    neighborhood: '',
    description: '',
    area_sqm: '',
    bedrooms: '',
    bathrooms: '',
    floor_number: '',
    is_furnished: false,
  });

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await propertiesApi.getById(id!);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        const prop = response.data;
        setProperty(prop);

        // Populate form with property data
        setFormData({
          title: prop.title || '',
          property_type: (prop.property_type as any) || 'apartment',
          status: (prop.status as any) || 'available',
          price: prop.price?.toString() || '',
          annual_rent: prop.annual_rent?.toString() || '',
          city: prop.city || '',
          address: prop.address || '',
          country: prop.country || 'Saudi Arabia',
          neighborhood: prop.neighborhood || '',
          description: prop.description || '',
          area_sqm: prop.area_sqm?.toString() || '',
          bedrooms: prop.bedrooms?.toString() || '',
          bathrooms: prop.bathrooms?.toString() || '',
          floor_number: prop.floor_number?.toString() || '',
          is_furnished: prop.is_furnished || false,
        });
      } else {
        throw new Error(t('errors.notFound'));
      }
    } catch (err) {
      console.error('Error fetching property:', err);
      setError(err instanceof Error ? err.message : t('errors.generalError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (event: any) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      if (!id) {
        throw new Error('Property ID is required');
      }

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description || null,
        property_type: formData.property_type,
        status: formData.status,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null,
        neighborhood: formData.neighborhood || null,
        area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        annual_rent: formData.annual_rent ? parseFloat(formData.annual_rent) : null,
        is_furnished: formData.is_furnished,
      };

      console.log('Updating property:', id, updateData);

      // Update property
      const result = await propertiesApi.update(id, updateData);

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('Property updated successfully:', result.data);

      // Navigate back to property detail
      navigate(`/dashboard/properties/${id}`);
    } catch (err) {
      console.error('Error updating property:', err);
      setError(err instanceof Error ? err.message : 'Failed to update property');
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

  if (error && !property) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard/properties')}>
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
          onClick={() => navigate(`/dashboard/properties/${id}`)}
        >
          {t('common:back')}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('editProperty')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {t('basicInfo')}
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('propertyName')}
                  value={formData.title}
                  onChange={handleChange('title')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('type')}</InputLabel>
                  <Select
                    value={formData.property_type}
                    label={t('type')}
                    onChange={handleChange('property_type')}
                  >
                    <MenuItem value="apartment">{t('types.apartment')}</MenuItem>
                    <MenuItem value="villa">{t('types.villa')}</MenuItem>
                    <MenuItem value="office">{t('types.office')}</MenuItem>
                    <MenuItem value="retail">{t('types.retail')}</MenuItem>
                    <MenuItem value="warehouse">{t('types.warehouse')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('status')}</InputLabel>
                  <Select
                    value={formData.status}
                    label={t('status')}
                    onChange={handleChange('status')}
                  >
                    <MenuItem value="available">{t('status.available')}</MenuItem>
                    <MenuItem value="rented">{t('status.rented')}</MenuItem>
                    <MenuItem value="maintenance">{t('status.maintenance')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('description')}
                  value={formData.description}
                  onChange={handleChange('description')}
                />
              </Grid>

              {/* Location */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
                  {t('location')}
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('address')}
                  value={formData.address}
                  onChange={handleChange('address')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('city')}
                  value={formData.city}
                  onChange={handleChange('city')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('country')}
                  value={formData.country}
                  onChange={handleChange('country')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('neighborhood')}
                  value={formData.neighborhood}
                  onChange={handleChange('neighborhood')}
                />
              </Grid>

              {/* Property Details */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
                  {t('propertyDetails')}
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('area')}
                  value={formData.area_sqm}
                  onChange={handleChange('area_sqm')}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('bedrooms')}
                  value={formData.bedrooms}
                  onChange={handleChange('bedrooms')}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('bathrooms')}
                  value={formData.bathrooms}
                  onChange={handleChange('bathrooms')}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('floor')}
                  value={formData.floor_number}
                  onChange={handleChange('floor_number')}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              {/* Pricing */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
                  {t('pricing')}
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('price')}
                  value={formData.price}
                  onChange={handleChange('price')}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('annualRent')}
                  value={formData.annual_rent}
                  onChange={handleChange('annual_rent')}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/dashboard/properties/${id}`)}
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
