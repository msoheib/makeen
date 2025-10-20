import { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { ArrowLeft, Building, Building2 } from 'lucide-react';
import { propertyGroupsApi, profilesApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';

export default function AddBuilding() {
  const { t } = useTranslation(['buildings', 'common']);
  const navigate = useNavigate();

  const [buildingForm, setBuildingForm] = useState({
    name: '',
    groupType: 'residential_building',
    address: '',
    city: '',
    country: '',
    neighborhood: '',
    floorsCount: '',
    ownerId: '',
  });

  const [unitsForm, setUnitsForm] = useState({
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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch owners for the dropdown
  const {
    data: owners,
    loading: ownersLoading,
    error: ownersError
  } = useApi(() => profilesApi.getAll({ role: 'owner' }), []);

  const handleBuildingChange = (field: string) => (event: any) => {
    setBuildingForm({ ...buildingForm, [field]: event.target.value });
  };

  const handleUnitsChange = (field: string) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setUnitsForm({ ...unitsForm, [field]: value });
  };

  const calculateTotalUnits = () => {
    const from = Number(unitsForm.floorsFrom) || 0;
    const to = Number(unitsForm.floorsTo) || 0;
    const per = Number(unitsForm.unitsPerFloor) || 0;
    return Math.max(0, (to - from + 1) * per);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Validate required fields
      if (!buildingForm.name || !buildingForm.ownerId) {
        throw new Error(t('validation.requiredFields'));
      }

      // Create building data
      const buildingData = {
        name: buildingForm.name,
        group_type: buildingForm.groupType,
        description: `${buildingForm.groupType} in ${buildingForm.city}`,
        address: buildingForm.address,
        city: buildingForm.city,
        country: buildingForm.country,
        neighborhood: buildingForm.neighborhood,
        floors_count: buildingForm.floorsCount ? parseInt(buildingForm.floorsCount) : null,
        owner_id: buildingForm.ownerId,
        status: 'active' as const,
      };

      // Create the building
      const buildingResult = await propertyGroupsApi.create(buildingData);
      
      if (buildingResult.error) {
        throw new Error(buildingResult.error.message);
      }

      const buildingId = buildingResult.data?.id;
      if (!buildingId) {
        throw new Error(t('errors.buildingCreationFailed'));
      }

      let unitsCreated = 0;

      // Generate units if requested
      if (unitsForm.generateUnits) {
        const totalUnits = calculateTotalUnits();
        if (totalUnits > 0) {
          const units = [];
          const floorsFrom = parseInt(unitsForm.floorsFrom) || 1;
          const floorsTo = parseInt(unitsForm.floorsTo) || 1;
          const unitsPerFloor = parseInt(unitsForm.unitsPerFloor) || 1;

          for (let floor = floorsFrom; floor <= floorsTo; floor++) {
            for (let unit = 1; unit <= unitsPerFloor; unit++) {
              const unitLabel = unitsForm.unitLabelPattern
                .replace('{floor}', floor.toString())
                .replace('{num}', unit.toString().padStart(2, '0'));

              const unitData = {
                title: unitLabel,
                description: `${unitsForm.unitType} unit in ${buildingForm.name}`,
                property_type: unitsForm.unitType === 'residential' ? 'apartment' : 'office',
                status: 'available' as const,
                address: buildingForm.address,
                city: buildingForm.city,
                country: buildingForm.country,
                neighborhood: buildingForm.neighborhood,
                area_sqm: parseFloat(unitsForm.defaultAreaSqm) || 80,
                bedrooms: unitsForm.unitType === 'residential' ? parseInt(unitsForm.defaultBedrooms) || 2 : null,
                bathrooms: parseInt(unitsForm.defaultBathrooms) || 1,
                price: parseFloat(unitsForm.defaultAnnualRent) || 0,
                annual_rent: parseFloat(unitsForm.defaultAnnualRent) || 0,
                payment_method: 'cash' as const,
                owner_id: buildingForm.ownerId,
                group_id: buildingId,
                property_code: unitLabel,
                floor_number: floor,
                building_name: buildingForm.name,
                is_furnished: false,
                service_charge: 0,
              };

              units.push(unitData);
            }
          }

          // Create units in bulk
          const unitsResult = await propertyGroupsApi.createUnitsBulk(buildingId, units);
          
          if (unitsResult.error) {
            throw new Error(unitsResult.error.message);
          }

          unitsCreated = unitsResult.data?.length || 0;
        }
      }

      // Show success message
      setSuccessMessage(
        t('buildingCreated') + 
        (unitsCreated > 0 ? ` ${t('withUnits', { count: unitsCreated })}` : '')
      );

      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/dashboard/buildings');
      }, 2000);

    } catch (error) {
      console.error('Error creating building:', error);
      setErrorMessage(
        error instanceof Error ? error.message : t('errors.unknownError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowLeft size={20} />}
          onClick={() => navigate('/dashboard/buildings')}
        >
          {t('common:back')}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('addBuilding')}
        </Typography>
      </Box>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Building Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {t('basicInfo')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('basicInfoDesc')}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label={t('buildingName')}
                  value={buildingForm.name}
                  onChange={handleBuildingChange('name')}
                  helperText={t('buildingNameHelper')}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('groupType')}</InputLabel>
                  <Select
                    value={buildingForm.groupType}
                    label={t('groupType')}
                    onChange={handleBuildingChange('groupType')}
                  >
                    <MenuItem value="residential_building">{t('groupTypes.residential_building')}</MenuItem>
                    <MenuItem value="apartment_block">{t('groupTypes.apartment_block')}</MenuItem>
                    <MenuItem value="villa_compound">{t('groupTypes.villa_compound')}</MenuItem>
                    <MenuItem value="other">{t('groupTypes.other')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                  {t('locationInfo')}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('address')}
                  value={buildingForm.address}
                  onChange={handleBuildingChange('address')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('city')}
                  value={buildingForm.city}
                  onChange={handleBuildingChange('city')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('country')}
                  value={buildingForm.country}
                  onChange={handleBuildingChange('country')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('neighborhood')}
                  value={buildingForm.neighborhood}
                  onChange={handleBuildingChange('neighborhood')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('floorsCount')}
                  type="number"
                  value={buildingForm.floorsCount}
                  onChange={handleBuildingChange('floorsCount')}
                />
              </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>{t('owner')}</InputLabel>
                      <Select
                        value={buildingForm.ownerId}
                        label={t('owner')}
                        onChange={handleBuildingChange('ownerId')}
                        disabled={ownersLoading}
                      >
                        {ownersLoading ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            {t('common:loading')}
                          </MenuItem>
                        ) : (
                          owners?.map((owner) => (
                            <MenuItem key={owner.id} value={owner.id}>
                              {owner.first_name} {owner.last_name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Units Generation */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {t('autoGenerate')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('autoGenerateDesc')}
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={unitsForm.generateUnits}
                  onChange={handleUnitsChange('generateUnits')}
                />
              }
              label={t('enableAutoGenerate')}
            />

            {unitsForm.generateUnits && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ my: 3 }} />

                {/* Unit Type */}
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  {t('unitType')}
                </Typography>
                <ToggleButtonGroup
                  value={unitsForm.unitType}
                  exclusive
                  onChange={(e, value) => {
                    if (value) {
                      setUnitsForm({
                        ...unitsForm,
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
                    <Building2 sx={{ mr: 1 }} />
                    {t('unitTypes.residential')}
                  </ToggleButton>
                  <ToggleButton value="commercial">
                    <Building sx={{ mr: 1 }} />
                    {t('unitTypes.commercial')}
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Building Layout */}
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  {t('buildingLayout')}
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label={t('floorsFrom')}
                      type="number"
                      value={unitsForm.floorsFrom}
                      onChange={handleUnitsChange('floorsFrom')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label={t('floorsTo')}
                      type="number"
                      value={unitsForm.floorsTo}
                      onChange={handleUnitsChange('floorsTo')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label={t('unitsPerFloor')}
                      type="number"
                      value={unitsForm.unitsPerFloor}
                      onChange={handleUnitsChange('unitsPerFloor')}
                    />
                  </Grid>
                </Grid>

                {/* Unit Naming */}
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  {t('unitNaming')}
                </Typography>
                <TextField
                  fullWidth
                  label={t('unitLabelPattern')}
                  value={unitsForm.unitLabelPattern}
                  onChange={handleUnitsChange('unitLabelPattern')}
                  helperText={t('unitLabelHelper')}
                  sx={{ mb: 3 }}
                />

                {/* Default Specifications */}
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  {t('defaultSpecs')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('bedrooms')}
                      type="number"
                      value={unitsForm.defaultBedrooms}
                      onChange={handleUnitsChange('defaultBedrooms')}
                      disabled={unitsForm.unitType === 'commercial'}
                      helperText={unitsForm.unitType === 'commercial' ? t('notAvailableForCommercial') : ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('bathrooms')}
                      type="number"
                      value={unitsForm.defaultBathrooms}
                      onChange={handleUnitsChange('defaultBathrooms')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('areaSqm')}
                      type="number"
                      value={unitsForm.defaultAreaSqm}
                      onChange={handleUnitsChange('defaultAreaSqm')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('annualRent')}
                      type="number"
                      value={unitsForm.defaultAnnualRent}
                      onChange={handleUnitsChange('defaultAnnualRent')}
                      InputProps={{
                        endAdornment: t('common:currency'),
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Summary */}
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    {t('summary')}
                  </Typography>
                  <Typography variant="body2">
                    {t('totalUnitsToCreate', { count: calculateTotalUnits() })}
                  </Typography>
                  <Typography variant="body2">
                    {t('floorRange', {
                      from: unitsForm.floorsFrom || '?',
                      to: unitsForm.floorsTo || '?'
                    })}
                  </Typography>
                  <Typography variant="body2">
                    {t('unitsPerFloorValue', { count: Number(unitsForm.unitsPerFloor) || 0 })}
                  </Typography>
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>

            {/* Submit */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard/buildings')}
                disabled={isSubmitting}
              >
                {t('common:cancel')}
              </Button>
              <Button 
                variant="contained" 
                type="submit"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? t('common:creating') : t('createBuilding')}
              </Button>
            </Box>
          </form>

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

          {/* Success Snackbar */}
          <Snackbar
            open={!!successMessage}
            autoHideDuration={4000}
            onClose={() => setSuccessMessage(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setSuccessMessage(null)}
              severity="success"
              sx={{ width: '100%' }}
            >
              {successMessage}
            </Alert>
          </Snackbar>
        </Box>
      );
    }
