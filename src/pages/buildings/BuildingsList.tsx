import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search, Plus, Building } from 'lucide-react';
import StatCard from '../../components/data/StatCard';
import { propertyGroupsApi } from '../../../lib/api';
import { Tables } from '../../../lib/database.types';

type PropertyGroup = Tables<'property_groups'>;

export default function BuildingsList() {
  const { t } = useTranslation(['buildings', 'common']);
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<PropertyGroup[]>([]);
  const [unitsCount, setUnitsCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await propertyGroupsApi.getAll();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setBuildings(result.data || []);

      // Fetch unit counts for each building
      if (result.data) {
        const counts: Record<string, number> = {};
        for (const building of result.data) {
          const detailResult = await propertyGroupsApi.getById(building.id);
          if (detailResult.data?.units) {
            counts[building.id] = detailResult.data.units.length;
          }
        }
        setUnitsCount(counts);
      }
    } catch (err) {
      console.error('Error fetching buildings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load buildings');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics for the buildings page
  const stats = {
    total: buildings.length,
    active: buildings.filter((b) => b.status === 'active').length,
    totalUnits: Object.values(unitsCount).reduce((sum, count) => sum + count, 0),
  };

  const filteredBuildings = buildings.filter((building) =>
    building.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchBuildings}>
          {t('common:retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          {t('title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('subtitle')}
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('totalBuildings')}
            value={stats.total}
            icon={<Building />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('activeBuildings')}
            value={stats.active}
            icon={<Building />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('totalUnits')}
            value={stats.totalUnits}
            icon={<Building />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Search and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Plus size={20} />}
                onClick={() => navigate('/dashboard/buildings/add')}
                sx={{ height: '56px' }}
              >
                {t('addBuilding')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Buildings List */}
      <Grid container spacing={2}>
        {filteredBuildings.map((building) => (
          <Grid item xs={12} key={building.id}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
              onClick={() => navigate(`/dashboard/buildings/${building.id}`)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Building size={24} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {building.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={t(`groupTypes.${building.group_type}`)}
                    color="primary"
                    size="small"
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      {t('city')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {building.city || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      {t('address')}
                    </Typography>
                    <Typography variant="body2">{building.address || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      {t('floors')}
                    </Typography>
                    <Typography variant="body2">{building.floors_count || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      {t('units')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {unitsCount[building.id] || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredBuildings.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('noBuildingsFound')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? t('adjustSearch') : t('addFirstBuilding')}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
