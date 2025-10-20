import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Apartment,
  Add,
  Home,
  Layers,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { propertyGroupsApi } from '../../../lib/api';
import { Tables } from '../../../lib/database.types';

type PropertyGroup = Tables<'property_groups'>;
type Property = Tables<'properties'>;

interface BuildingWithUnits extends PropertyGroup {
  units?: Property[];
}

export default function BuildingDetail() {
  const { t } = useTranslation(['buildings', 'properties', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [building, setBuilding] = useState<BuildingWithUnits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBuilding();
    }
  }, [id]);

  const fetchBuilding = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await propertyGroupsApi.getById(id!);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        setBuilding(response.data);
      }
    } catch (err) {
      console.error('Error fetching building:', err);
      setError(err instanceof Error ? err.message : t('errors.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = () => {
    navigate(`/dashboard/properties/add?groupId=${id}`);
  };

  const handleUnitClick = (unitId: string) => {
    navigate(`/dashboard/properties/${unitId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !building) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchBuilding}>
              {t('common:retry')}
            </Button>
          }
        >
          {error || t('errors.unknownError')}
        </Alert>
      </Box>
    );
  }

  const units = building.units || [];
  const statusColor = building.status === 'active' ? 'success' : 'default';

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/dashboard/buildings')} edge="start">
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {building.name}
        </Typography>
        <Chip
          label={building.status}
          color={statusColor}
          size="medium"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Building Information Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Home />
                {t('basicInfo')}
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('groupType')}
                </Typography>
                <Typography variant="body1">
                  {building.group_type && t(`groupTypes.${building.group_type}`, building.group_type)}
                </Typography>
              </Box>

              {building.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('common:description')}
                  </Typography>
                  <Typography variant="body2">
                    {building.description}
                  </Typography>
                </Box>
              )}

              {building.floors_count && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('floorsCount')}
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Layers fontSize="small" />
                    {building.floors_count} {t('floors')}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('properties:location')}
                </Typography>
                {building.address && (
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <LocationOn fontSize="small" color="action" />
                    {building.address}
                  </Typography>
                )}
                <Typography variant="body2">
                  {[building.neighborhood, building.city, building.country].filter(Boolean).join(', ')}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Button
                variant="contained"
                startIcon={<Add />}
                fullWidth
                onClick={handleAddUnit}
              >
                {t('properties:addProperty')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Units List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Apartment />
                  {t('units')}
                </Typography>
                <Chip
                  label={`${units.length} ${t('units')}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {units.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 6,
                    px: 2,
                    bgcolor: 'background.default',
                    borderRadius: 2,
                  }}
                >
                  <Apartment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('properties:noProperties')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('properties:addFirstProperty')}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddUnit}
                  >
                    {t('properties:addProperty')}
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {units.map((unit) => (
                    <Grid item xs={12} sm={6} key={unit.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          },
                        }}
                        onClick={() => handleUnitClick(unit.id)}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {unit.title}
                          </Typography>

                          {unit.floor_number && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {t('properties:floor')}: {unit.floor_number}
                            </Typography>
                          )}

                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={unit.status}
                              size="small"
                              color={unit.status === 'available' ? 'success' : 'default'}
                            />
                            {unit.property_type && (
                              <Chip
                                label={t(`properties:type${unit.property_type.charAt(0).toUpperCase() + unit.property_type.slice(1)}`, unit.property_type)}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>

                          {unit.area_sqm && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {unit.area_sqm} {t('properties:sqm')}
                            </Typography>
                          )}

                          {unit.bedrooms && (
                            <Typography variant="body2" color="text.secondary">
                              {unit.bedrooms} {t('properties:bedrooms')} • {unit.bathrooms || 0} {t('properties:bathrooms')}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
