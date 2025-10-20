import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  TableRows as TableViewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ResponsiveContainer from '../../components/layout/ResponsiveContainer';
import PropertyCard, { PropertyCardSkeleton } from '../../components/data/PropertyCard';
import DataTable, { Column } from '../../components/data/DataTable';
import { Property } from '../../../lib/types';
import { propertiesApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';

type ViewMode = 'grid' | 'table';

export default function PropertiesList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { t } = useTranslation(['properties', 'common']);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch properties from Supabase
  const { 
    data: properties, 
    loading, 
    error, 
    refetch 
  } = useApi(() => propertiesApi.getAll({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    property_type: typeFilter !== 'all' ? typeFilter : undefined,
  }), [statusFilter, typeFilter]);

  // Show error message if API call fails
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  // Filter properties
  const filteredProperties = (properties || []).filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesType = typeFilter === 'all' || property.property_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Table columns configuration
  const tableColumns: Column<Property>[] = [
    {
      id: 'title',
      label: t('title'),
      minWidth: 200,
    },
    {
      id: 'property_type',
      label: t('type'),
      minWidth: 120,
      format: (value) => t(`types.${value}`),
      hideOnMobile: true,
    },
    {
      id: 'status',
      label: t('status.label'),
      minWidth: 120,
      format: (value) => (
        <Chip
          label={t(`status.${value}`)}
          size="small"
          color={
            value === 'available'
              ? 'success'
              : value === 'rented'
              ? 'primary'
              : value === 'maintenance'
              ? 'warning'
              : 'info'
          }
        />
      ),
    },
    {
      id: 'city',
      label: t('city'),
      minWidth: 100,
      hideOnMobile: true,
    },
    {
      id: 'price',
      label: t('price'),
      minWidth: 120,
      align: 'right',
      format: (value) => `${value.toLocaleString()} ${t('common:currency')}`,
    },
  ];

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <ResponsiveContainer>
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

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem' },
          }}
        >
          {t('title')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!isMobile && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="grid">
                <GridViewIcon />
              </ToggleButton>
              <ToggleButton value="table">
                <TableViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refetch}
            disabled={loading}
            sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
          >
            {t('common:refresh')}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/dashboard/properties/add')}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {t('add')}
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {/* Search */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Status Filter */}
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('status.label')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('status.label')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">{t('common:all')}</MenuItem>
                <MenuItem value="available">{t('status.available')}</MenuItem>
                <MenuItem value="rented">{t('status.rented')}</MenuItem>
                <MenuItem value="maintenance">{t('status.maintenance')}</MenuItem>
                <MenuItem value="reserved">{t('status.reserved')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Type Filter */}
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('type')}</InputLabel>
              <Select
                value={typeFilter}
                label={t('type')}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">{t('common:all')}</MenuItem>
                <MenuItem value="apartment">{t('types.apartment')}</MenuItem>
                <MenuItem value="villa">{t('types.villa')}</MenuItem>
                <MenuItem value="office">{t('types.office')}</MenuItem>
                <MenuItem value="retail">{t('types.retail')}</MenuItem>
                <MenuItem value="warehouse">{t('types.warehouse')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {(statusFilter !== 'all' || typeFilter !== 'all') && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {t('common:activeFilters')}:
            </Typography>
            {statusFilter !== 'all' && (
              <Chip
                label={`${t('status.label')}: ${t(`status.${statusFilter}`)}`}
                size="small"
                onDelete={() => setStatusFilter('all')}
              />
            )}
            {typeFilter !== 'all' && (
              <Chip
                label={`${t('type')}: ${t(`types.${typeFilter}`)}`}
                size="small"
                onDelete={() => setTypeFilter('all')}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredProperties.length} {t('found')}
      </Typography>

      {/* Grid View */}
      {(viewMode === 'grid' || isMobile) && (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <PropertyCardSkeleton />
                </Grid>
              ))
            : filteredProperties.map((property) => (
                <Grid item xs={12} sm={6} md={4} key={property.id}>
                  <PropertyCard
                    id={property.id}
                    title={property.title}
                    address={property.address}
                    city={property.city}
                    propertyType={property.property_type}
                    status={property.status}
                    price={property.price}
                    imageUrl={property.images?.[0] || undefined}
                    bedrooms={property.bedrooms || undefined}
                    bathrooms={property.bathrooms || undefined}
                    area={property.area_sqm || undefined}
                  />
                </Grid>
              ))}
        </Grid>
      )}

      {/* Table View */}
      {viewMode === 'table' && !isMobile && (
        <DataTable
          columns={tableColumns}
          rows={filteredProperties}
          idField="id"
          onView={(property) => navigate(`/dashboard/properties/${property.id}`)}
          onEdit={(property) => navigate(`/dashboard/properties/${property.id}/edit`)}
          loading={loading}
          emptyMessage={t('noProperties')}
        />
      )}
    </ResponsiveContainer>
  );
}
