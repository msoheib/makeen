import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Divider,
} from '@mui/material';
import {
  ArrowLeft,
  MapPin,
  Home,
  Bath,
  Bed,
  Square,
  DollarSign,
  Calendar,
  User,
  Edit
} from 'lucide-react';
import { propertiesApi } from '../../../lib/api';
import { Tables } from '../../../lib/database.types';
import { useAppStore } from '../../../lib/store';

type Property = Tables<'properties'>;

export default function PropertyDetail() {
  const { t } = useTranslation(['properties', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAppStore((state) => state.user);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user can edit this property
  const canEdit = user && (
    user.role === 'admin' ||
    user.role === 'manager' ||
    (user.role === 'owner' && property?.owner_id === user.id)
  );

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
        setProperty(response.data);
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

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !property) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || t('errors.notFound')}
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
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowLeft size={20} />}
            onClick={() => navigate('/dashboard/properties')}
          >
            {t('common:back')}
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {property.title}
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Edit size={20} />}
            onClick={() => navigate(`/dashboard/properties/${id}/edit`)}
          >
            {t('common:edit')}
          </Button>
        )}
      </Box>

      {/* Property Details */}
      <Grid container spacing={3}>
        {/* Main Info Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {property.title}
                </Typography>
                <Chip
                  label={t(`status.${property.status}`)}
                  color={property.status === 'available' ? 'success' :
                         property.status === 'rented' ? 'warning' : 'default'}
                  size="small"
                />
              </Box>

              {property.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {property.description}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Property Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Home size={20} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t('type')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {t(`types.${property.property_type}`)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {property.bedrooms && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Bed size={20} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t('bedrooms')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {property.bedrooms}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {property.bathrooms && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Bath size={20} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t('bathrooms')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {property.bathrooms}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {property.area_sqm && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Square size={20} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t('area')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {property.area_sqm} {t('sqm')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Location */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MapPin size={20} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {t('location')}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {property.address}
                </Typography>
                {property.city && (
                  <Typography variant="body2" color="text.secondary">
                    {property.city}{property.country && `, ${property.country}`}
                  </Typography>
                )}
                {property.neighborhood && (
                  <Typography variant="body2" color="text.secondary">
                    {t('neighborhood')}: {property.neighborhood}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pricing Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                {t('pricing')}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DollarSign size={20} />
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('price')}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {property.price?.toLocaleString()} {t('common:currency')}
                </Typography>
              </Box>

              {property.annual_rent && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('annualRent')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {property.annual_rent?.toLocaleString()} {t('common:currency')}
                  </Typography>
                </Box>
              )}

              {property.payment_method && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('paymentMethod')}
                  </Typography>
                  <Typography variant="body2">
                    {t(`paymentMethods.${property.payment_method}`)}
                  </Typography>
                </Box>
              )}

              {property.is_furnished !== null && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('furnished')}
                  </Typography>
                  <Typography variant="body2">
                    {property.is_furnished ? t('common:yes') : t('common:no')}
                  </Typography>
                </Box>
              )}

              {property.floor_number && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('floor')}
                  </Typography>
                  <Typography variant="body2">
                    {property.floor_number}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          {property.building_name && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {t('buildingInfo')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {property.building_name}
                </Typography>
                {property.property_code && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {t('propertyCode')}: {property.property_code}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
