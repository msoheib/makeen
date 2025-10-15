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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  TableRows as TableViewIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ResponsiveContainer from '../../components/layout/ResponsiveContainer';
import PropertyCard, { PropertyCardSkeleton } from '../../components/data/PropertyCard';
import DataTable, { Column } from '../../components/data/DataTable';
import { Property } from '../../../lib/types';

type ViewMode = 'grid' | 'table';

export default function PropertiesList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading properties
    // In production, this would be a Supabase query
    const loadProperties = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      const mockProperties: Property[] = [
        {
          id: '1',
          title: 'Luxury Apartment in Downtown',
          description: 'Beautiful 3-bedroom apartment with city views',
          property_type: 'apartment',
          status: 'available',
          address: '123 Main Street',
          city: 'Riyadh',
          country: 'Saudi Arabia',
          price: 15000,
          size: 150,
          bedrooms: 3,
          bathrooms: 2,
          image_url: null,
          created_at: new Date().toISOString(),
          owner_id: 'owner1',
        },
        {
          id: '2',
          title: 'Modern Villa with Pool',
          description: 'Spacious 5-bedroom villa with private pool',
          property_type: 'villa',
          status: 'rented',
          address: '456 Palm Avenue',
          city: 'Jeddah',
          country: 'Saudi Arabia',
          price: 35000,
          size: 400,
          bedrooms: 5,
          bathrooms: 4,
          image_url: null,
          created_at: new Date().toISOString(),
          owner_id: 'owner1',
        },
        {
          id: '3',
          title: 'Office Space - Business District',
          description: 'Prime office location with modern facilities',
          property_type: 'office',
          status: 'available',
          address: '789 Business Road',
          city: 'Riyadh',
          country: 'Saudi Arabia',
          price: 25000,
          size: 200,
          bedrooms: 0,
          bathrooms: 2,
          image_url: null,
          created_at: new Date().toISOString(),
          owner_id: 'owner1',
        },
      ];

      setProperties(mockProperties);
      setLoading(false);
    };

    loadProperties();
  }, []);

  // Filter properties
  const filteredProperties = properties.filter((property) => {
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
      label: t('properties.title'),
      minWidth: 200,
    },
    {
      id: 'property_type',
      label: t('properties.type'),
      minWidth: 120,
      format: (value) => t(`properties.types.${value}`),
      hideOnMobile: true,
    },
    {
      id: 'status',
      label: t('properties.status.label'),
      minWidth: 120,
      format: (value) => (
        <Chip
          label={t(`properties.status.${value}`)}
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
      label: t('properties.city'),
      minWidth: 100,
      hideOnMobile: true,
    },
    {
      id: 'price',
      label: t('properties.price'),
      minWidth: 120,
      align: 'right',
      format: (value) => `${value.toLocaleString()} SAR`,
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
          {t('properties.title')}
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
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/dashboard/properties/add')}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {t('properties.add')}
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
              placeholder={t('properties.search')}
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
              <InputLabel>{t('properties.status.label')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('properties.status.label')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                <MenuItem value="available">{t('properties.status.available')}</MenuItem>
                <MenuItem value="rented">{t('properties.status.rented')}</MenuItem>
                <MenuItem value="maintenance">{t('properties.status.maintenance')}</MenuItem>
                <MenuItem value="reserved">{t('properties.status.reserved')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Type Filter */}
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('properties.type')}</InputLabel>
              <Select
                value={typeFilter}
                label={t('properties.type')}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                <MenuItem value="apartment">{t('properties.types.apartment')}</MenuItem>
                <MenuItem value="villa">{t('properties.types.villa')}</MenuItem>
                <MenuItem value="office">{t('properties.types.office')}</MenuItem>
                <MenuItem value="retail">{t('properties.types.retail')}</MenuItem>
                <MenuItem value="warehouse">{t('properties.types.warehouse')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {(statusFilter !== 'all' || typeFilter !== 'all') && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {t('common.activeFilters')}:
            </Typography>
            {statusFilter !== 'all' && (
              <Chip
                label={`${t('properties.status.label')}: ${t(`properties.status.${statusFilter}`)}`}
                size="small"
                onDelete={() => setStatusFilter('all')}
              />
            )}
            {typeFilter !== 'all' && (
              <Chip
                label={`${t('properties.type')}: ${t(`properties.types.${typeFilter}`)}`}
                size="small"
                onDelete={() => setTypeFilter('all')}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredProperties.length} {t('properties.found')}
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
                    imageUrl={property.image_url || undefined}
                    bedrooms={property.bedrooms || undefined}
                    bathrooms={property.bathrooms || undefined}
                    area={property.size || undefined}
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
          emptyMessage={t('properties.noProperties')}
        />
      )}
    </ResponsiveContainer>
  );
}
