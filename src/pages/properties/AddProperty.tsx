import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Switch,
  FormControlLabel,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowLeft, Building, Building2 } from 'lucide-react';
import { propertiesApi } from '../../../lib/api';
import { useAppStore } from '../../../lib/store';

export default function AddProperty() {
  const { t } = useTranslation(['properties', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const user = useAppStore((state) => state.user);
  const language = useAppStore((state) => state.settings.language);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  });

  const [isBuilding, setIsBuilding] = useState(false);
  const [buildingUnits, setBuildingUnits] = useState({
    generateUnits: false,
    floorsFrom: '1',
    floorsTo: '1',
    unitsPerFloor: '1',
    unitLabelPattern: 'Unit {floor}{num}',
    defaultBedrooms: '2',
    defaultBathrooms: '1',
    defaultAreaSqm: '80',
    defaultAnnualRent: '',
    unitType: 'residential' as 'residential' | 'commercial',
  });

  const handleChange = (field: string) => (event: any) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleUnitsChange = (field: string) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setBuildingUnits({ ...buildingUnits, [field]: value });
  };

  const calculateTotalUnits = () => {
    const from = Number(buildingUnits.floorsFrom) || 0;
    const to = Number(buildingUnits.floorsTo) || 0;
    const per = Number(buildingUnits.unitsPerFloor) || 0;
    return Math.max(0, (to - from + 1) * per);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      // Validate area_sqm (required, numeric, > 0)
      const parsedArea = parseFloat(formData.area_sqm);
      if (!formData.area_sqm || Number.isNaN(parsedArea) || parsedArea <= 0) {
        setError('Please enter a valid area in square meters (> 0).');
        setLoading(false);
        return;
      }

      // Prepare property data
      const propertyData = {
        title: formData.title,
        description: formData.description || null,
        property_type: formData.property_type,
        status: formData.status,
        listing_type: 'rent' as const,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null,
        neighborhood: formData.neighborhood || null,
        area_sqm: parsedArea,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        annual_rent: formData.annual_rent ? parseFloat(formData.annual_rent) : null,
        payment_frequency: 'monthly' as const,
        payment_method: 'cash' as const,
        owner_id: user.id,
        images: [],
        is_accepting_bids: false,
        group_id: groupId || null,
      };

      console.log('Submitting property data:', propertyData);

      // Create property
      const result = await propertiesApi.create(propertyData, user.id);

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('Property created successfully:', result.data);

      // Navigate back to building detail if groupId exists, otherwise to properties list
      if (groupId) {
        navigate(`/dashboard/buildings/${groupId}`);
      } else {
        navigate('/dashboard/properties');
      }
    } catch (err) {
      console.error('Error creating property:', err);
      setError(err instanceof Error ? err.message : 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box dir={language === 'ar' ? 'rtl' : 'ltr'} sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowLeft size={20} />}
          onClick={() => navigate('/dashboard/properties')}
        >
          {t('common:back')}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('add')}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('imagesNote')}
          </Alert>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label={t('name')}
                  value={formData.title}
                  onChange={handleChange('title')}
                  disabled={loading}
                  inputProps={{
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('type')}</InputLabel>
                  <Select
                    value={formData.property_type}
                    label={t('type')}
                    onChange={handleChange('property_type')}
                    disabled={loading}
                  >
                    <MenuItem value="apartment">{t('types.apartment')}</MenuItem>
                    <MenuItem value="villa">{t('types.villa')}</MenuItem>
                    <MenuItem value="office">{t('types.office')}</MenuItem>
                    <MenuItem value="retail">{t('types.retail')}</MenuItem>
                    <MenuItem value="warehouse">{t('types.warehouse')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('status.label')}</InputLabel>
                  <Select
                    value={formData.status}
                    label={t('status.label')}
                    onChange={handleChange('status')}
                    disabled={loading}
                  >
                    <MenuItem value="available">{t('status.available')}</MenuItem>
                    <MenuItem value="rented">{t('status.rented')}</MenuItem>
                    <MenuItem value="maintenance">{t('status.maintenance')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('price')}
                  type="number"
                  value={formData.price}
                  onChange={handleChange('price')}
                  disabled={loading}
                  inputProps={{
                    min: 0,
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                  InputProps={{
                    endAdornment: t('common:currency'),
                  }}
                  helperText={t('common:optional', { defaultValue: 'Optional' })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('annualRent')}
                  type="number"
                  value={formData.annual_rent}
                  onChange={handleChange('annual_rent')}
                  disabled={loading}
                  inputProps={{
                    min: 0,
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                  InputProps={{
                    endAdornment: t('common:currency'),
                  }}
                  helperText={t('common:optional', { defaultValue: 'Optional' })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('city')}
                  value={formData.city}
                  onChange={handleChange('city')}
                  disabled={loading}
                  inputProps={{
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                  helperText={t('common:optional', { defaultValue: 'Optional' })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('neighborhood')}
                  value={formData.neighborhood}
                  onChange={handleChange('neighborhood')}
                  disabled={loading}
                  inputProps={{
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('address')}
                  value={formData.address}
                  onChange={handleChange('address')}
                  disabled={loading}
                  inputProps={{
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                  helperText={t('common:optional', { defaultValue: 'Optional' })}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label={t('bedrooms')}
                  type="number"
                  value={formData.bedrooms}
                  onChange={handleChange('bedrooms')}
                  disabled={loading}
                  inputProps={{
                    min: 0,
                    step: 1,
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                  helperText={t('common:optional', { defaultValue: 'Optional' })}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label={t('bathrooms')}
                  type="number"
                  value={formData.bathrooms}
                  onChange={handleChange('bathrooms')}
                  disabled={loading}
                  inputProps={{
                    min: 0,
                    step: 1,
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                  helperText={t('common:optional', { defaultValue: 'Optional' })}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  required
                  label={t('area')}
                  type="number"
                  value={formData.area_sqm}
                  onChange={handleChange('area_sqm')}
                  disabled={loading}
                  inputProps={{
                    min: 1,
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                  InputProps={{
                    endAdornment: t('sqm'),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label={t('floor')}
                  type="number"
                  value={formData.floor_number}
                  onChange={handleChange('floor_number')}
                  disabled={loading}
                  inputProps={{
                    min: 0,
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                  helperText={t('common:optional', { defaultValue: 'Optional' })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label={t('description')}
                  value={formData.description}
                  onChange={handleChange('description')}
                  disabled={loading}
                  inputProps={{
                    dir: language === 'ar' ? 'rtl' : 'ltr',
                    style: { textAlign: language === 'ar' ? 'right' : 'left' }
                  }}
                />
              </Grid>

              {/* Building Option */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={isBuilding}
                      onChange={(e) => setIsBuilding(e.target.checked)}
                    />
                  }
                  label={t('buildings:createAsBuilding')}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  {t('buildings:createAsBuildingDesc')}
                </Typography>
              </Grid>

              {isBuilding && (
                <>
                  {/* Units Generation */}
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {t('buildings:autoGenerate')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          {t('buildings:autoGenerateDesc')}
                        </Typography>

                        <FormControlLabel
                          control={
                            <Switch
                              checked={buildingUnits.generateUnits}
                              onChange={handleUnitsChange('generateUnits')}
                            />
                          }
                          label={t('buildings:enableAutoGenerate')}
                        />

                        {buildingUnits.generateUnits && (
                          <Box sx={{ mt: 3 }}>
                            <Divider sx={{ my: 3 }} />

                            {/* Unit Type */}
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                              {t('buildings:unitType')}
                            </Typography>
                            <ToggleButtonGroup
                              value={buildingUnits.unitType}
                              exclusive
                              onChange={(e, value) => {
                                if (value) {
                                  setBuildingUnits({
                                    ...buildingUnits,
                                    unitType: value,
                                    unitLabelPattern: value === 'residential'
                                      ? 'Unit {floor}{num}'
                                      : 'Commercial {floor}{num}'
                                  });
                                }
                              }}
                              fullWidth
                              sx={{ mb: 3 }}
                            >
                              <ToggleButton value="residential">
                                <Building2 size={20} style={{ marginRight: 8 }} />
                                {t('buildings:unitTypes.residential')}
                              </ToggleButton>
                              <ToggleButton value="commercial">
                                <Building size={20} style={{ marginRight: 8 }} />
                                {t('buildings:unitTypes.commercial')}
                              </ToggleButton>
                            </ToggleButtonGroup>

                            {/* Building Layout */}
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                              {t('buildings:buildingLayout')}
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  label={t('buildings:floorsFrom')}
                                  type="number"
                                  value={buildingUnits.floorsFrom}
                                  onChange={handleUnitsChange('floorsFrom')}
                                  inputProps={{ min: 1 }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  label={t('buildings:floorsTo')}
                                  type="number"
                                  value={buildingUnits.floorsTo}
                                  onChange={handleUnitsChange('floorsTo')}
                                  inputProps={{ min: 1 }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  label={t('buildings:unitsPerFloor')}
                                  type="number"
                                  value={buildingUnits.unitsPerFloor}
                                  onChange={handleUnitsChange('unitsPerFloor')}
                                  inputProps={{ min: 1 }}
                                />
                              </Grid>
                            </Grid>

                            {/* Unit Label Pattern */}
                            <TextField
                              fullWidth
                              label={t('buildings:unitLabelPattern')}
                              value={buildingUnits.unitLabelPattern}
                              onChange={handleUnitsChange('unitLabelPattern')}
                              helperText={t('buildings:unitLabelPatternHelp')}
                              sx={{ mb: 3 }}
                            />

                            {/* Default Unit Specifications */}
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                              {t('buildings:defaultSpecs')}
                            </Typography>
                            <Grid container spacing={2}>
                              {buildingUnits.unitType === 'residential' && (
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    label={t('buildings:bedrooms')}
                                    type="number"
                                    value={buildingUnits.defaultBedrooms}
                                    onChange={handleUnitsChange('defaultBedrooms')}
                                    inputProps={{ min: 0 }}
                                  />
                                </Grid>
                              )}
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label={t('buildings:bathrooms')}
                                  type="number"
                                  value={buildingUnits.defaultBathrooms}
                                  onChange={handleUnitsChange('defaultBathrooms')}
                                  inputProps={{ min: 1 }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label={t('buildings:areaSqm')}
                                  type="number"
                                  value={buildingUnits.defaultAreaSqm}
                                  onChange={handleUnitsChange('defaultAreaSqm')}
                                  inputProps={{ min: 1 }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label={t('buildings:annualRent')}
                                  type="number"
                                  value={buildingUnits.defaultAnnualRent}
                                  onChange={handleUnitsChange('defaultAnnualRent')}
                                  inputProps={{ min: 0 }}
                                />
                              </Grid>
                            </Grid>

                            {/* Summary */}
                            <Alert severity="info" sx={{ mt: 3 }}>
                              <Typography variant="body2">
                                {t('buildings:totalUnitsToCreate')}: <strong>{calculateTotalUnits()}</strong>
                              </Typography>
                            </Alert>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard/properties')}
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button variant="contained" type="submit" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : t('add')}
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
