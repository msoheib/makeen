import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  Download,
  Eye,
  Filter,
} from 'lucide-react';
import StatCard from '../../components/data/StatCard';
import { supabase } from '../../../lib/supabase';
import { useAppStore } from '../../../lib/store';
import { formatDate } from '../../../lib/dateUtils';

interface Report {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'property' | 'tenant' | 'operations';
  lastGenerated?: string;
  status: 'available' | 'generating' | 'scheduled';
}

interface Property {
  id: string;
  title: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Owner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function ReportsList() {
  const { t } = useTranslation(['reports', 'common']);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const [activeTab, setActiveTab] = useState(0);
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter dialog state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Data for filters
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const reports: Report[] = [
    {
      id: '1',
      name: t('revenueReport'),
      description: t('revenueReportDesc'),
      category: 'financial',
      lastGenerated: '2024-01-15',
      status: 'available',
    },
    {
      id: '2',
      name: t('expenseReport'),
      description: t('expenseReportDesc'),
      category: 'financial',
      lastGenerated: '2024-01-15',
      status: 'available',
    },
    {
      id: '3',
      name: t('profitLoss'),
      description: t('profitLossDesc'),
      category: 'financial',
      lastGenerated: '2024-01-10',
      status: 'available',
    },
    {
      id: '4',
      name: t('cashFlow'),
      description: t('cashFlowDesc'),
      category: 'financial',
      lastGenerated: '2024-01-12',
      status: 'available',
    },
    {
      id: '5',
      name: t('occupancyReport'),
      description: t('occupancyReportDesc'),
      category: 'property',
      lastGenerated: '2024-01-14',
      status: 'available',
    },
    {
      id: '6',
      name: t('propertyPerformance'),
      description: t('propertyPerformanceDesc'),
      category: 'property',
      lastGenerated: '2024-01-13',
      status: 'available',
    },
    {
      id: '7',
      name: t('maintenanceReport'),
      description: t('maintenanceReportDesc'),
      category: 'property',
      lastGenerated: '2024-01-11',
      status: 'available',
    },
    {
      id: '8',
      name: t('tenantReport'),
      description: t('tenantReportDesc'),
      category: 'tenant',
      lastGenerated: '2024-01-15',
      status: 'available',
    },
    {
      id: '9',
      name: t('paymentHistory'),
      description: t('paymentHistoryDesc'),
      category: 'tenant',
      lastGenerated: '2024-01-14',
      status: 'available',
    },
    {
      id: '10',
      name: t('leaseExpiry'),
      description: t('leaseExpiryDesc'),
      category: 'tenant',
      lastGenerated: '2024-01-12',
      status: 'available',
    },
    {
      id: '11',
      name: t('operationsSummary'),
      description: t('operationsSummaryDesc'),
      category: 'operations',
      lastGenerated: '2024-01-15',
      status: 'available',
    },
    {
      id: '12',
      name: t('vendorReport'),
      description: t('vendorReportDesc'),
      category: 'operations',
      lastGenerated: '2024-01-13',
      status: 'available',
    },
  ];

  const categories = [
    { value: 'all', label: t('allReports'), icon: <FileText /> },
    { value: 'financial', label: t('financial'), icon: <DollarSign /> },
    { value: 'property', label: t('properties'), icon: <Building2 /> },
    { value: 'tenant', label: t('tenants'), icon: <Users /> },
    { value: 'operations', label: t('operations'), icon: <TrendingUp /> },
  ];

  const filteredReports =
    activeTab === 0
      ? reports
      : reports.filter((r) => r.category === categories[activeTab].value);

  const stats = {
    total: reports.length,
    financial: reports.filter((r) => r.category === 'financial').length,
    property: reports.filter((r) => r.category === 'property').length,
    tenant: reports.filter((r) => r.category === 'tenant').length,
  };

  const categoryColors = {
    financial: 'success',
    property: 'primary',
    tenant: 'info',
    operations: 'warning',
  } as const;

  // Map report IDs to types for PDF generation
  const reportTypeMap: { [key: string]: string } = {
    '1': 'revenue',
    '2': 'expense',
    '3': 'profit-loss',
    '4': 'cash-flow',
    '5': 'occupancy',
    '6': 'property-performance',
    '7': 'maintenance-costs',
    '8': 'tenant',
    '9': 'payment-history',
    '10': 'lease-expiry',
    '11': 'operations',
    '12': 'vendor',
  };

  // Load filter data
  useEffect(() => {
    loadFilterData();
  }, [user]);

  const loadFilterData = async () => {
    setLoadingFilters(true);
    try {
      const isOwner = user?.role === 'owner';
      const currentUserId = user?.id;

      // Load properties - filtered by owner if user is owner
      let propertiesQuery = supabase
        .from('properties')
        .select('id, title, owner_id')
        .order('title');

      if (isOwner && currentUserId) {
        propertiesQuery = propertiesQuery.eq('owner_id', currentUserId);
      }

      const { data: propertiesData, error: propertiesError } = await propertiesQuery;
      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Load tenants - for owners, only load tenants who are renting their properties
      let tenantsData: Tenant[] = [];
      if (isOwner && currentUserId) {
        // Get tenants from active contracts for owner's properties
        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select(`
            tenant_id,
            tenant:profiles!contracts_tenant_id_fkey(id, first_name, last_name, email),
            property:properties!contracts_property_id_fkey(owner_id)
          `)
          .eq('property.owner_id', currentUserId)
          .eq('status', 'active');

        if (contractsError) throw contractsError;

        // Extract unique tenants
        const uniqueTenants = new Map<string, Tenant>();
        contractsData?.forEach((contract: any) => {
          if (contract.tenant && contract.tenant.id) {
            uniqueTenants.set(contract.tenant.id, {
              id: contract.tenant.id,
              first_name: contract.tenant.first_name,
              last_name: contract.tenant.last_name,
              email: contract.tenant.email,
            });
          }
        });
        tenantsData = Array.from(uniqueTenants.values()).sort((a, b) =>
          a.first_name.localeCompare(b.first_name)
        );
      } else {
        // Admin/Manager see all tenants
        const { data, error: tenantsError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('role', 'tenant')
          .order('first_name');

        if (tenantsError) throw tenantsError;
        tenantsData = data || [];
      }
      setTenants(tenantsData);

      // Load owners - only for admin/manager, not for owners themselves
      if (!isOwner) {
        const { data: ownersData, error: ownersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('role', 'owner')
          .order('first_name');

        if (ownersError) throw ownersError;
        setOwners(ownersData || []);
      } else {
        // For owners, pre-select their own ID
        setSelectedOwner(currentUserId || '');
        setOwners([]);
      }
    } catch (err) {
      console.error('Error loading filter data:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleViewReport = (reportId: string) => {
    // Open filter dialog to configure and download report
    handleOpenFilterDialog(reportId);
  };

  const handleOpenFilterDialog = (reportId: string) => {
    setSelectedReportId(reportId);
    setFilterDialogOpen(true);
  };

  const handleCloseFilterDialog = () => {
    setFilterDialogOpen(false);
    setSelectedReportId(null);
    setSelectedProperty('');
    setSelectedTenant('');
    setSelectedOwner('');
  };

  const handleDownloadWithFilters = async () => {
    if (!selectedReportId) return;

    handleCloseFilterDialog();
    await handleDownloadReport(selectedReportId, {
      propertyId: selectedProperty || undefined,
      tenantId: selectedTenant || undefined,
      ownerId: selectedOwner || undefined,
      startDate,
      endDate,
    });
  };

  const handleDownloadReport = async (reportId: string, filters?: {
    propertyId?: string;
    tenantId?: string;
    ownerId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const reportType = reportTypeMap[reportId];
    if (!reportType) {
      setError('Invalid report type');
      return;
    }

    setLoadingReport(reportId);
    setError(null);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to download reports');
        return;
      }

      // Get Supabase URL from environment
      const supabaseUrl = 'https://fbabpaorcvatejkrelrf.supabase.co';
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/pdf-generator`;

      // Prepare request body with filters
      const requestBody: any = {
        reportType: reportType === 'revenue' ? 'revenue' :
                     reportType === 'expense' ? 'expense' :
                     reportType === 'occupancy' ? 'property' :
                     reportType === 'tenant' ? 'tenant' :
                     reportType === 'maintenance-costs' ? 'maintenance' : 'revenue',
        dateRange: {
          startDate: filters?.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString(),
          endDate: filters?.endDate || new Date().toISOString(),
        },
      };

      // Add filters if provided
      if (filters?.propertyId) {
        requestBody.propertyId = filters.propertyId;
      }
      if (filters?.tenantId) {
        requestBody.tenantId = filters.tenantId;
      }
      if (filters?.ownerId) {
        requestBody.ownerId = filters.ownerId;
      }

      // CRITICAL: Auto-apply owner filter for owner users
      // If user is an owner and no ownerId filter is explicitly provided, automatically filter by their ID
      if (user?.role === 'owner' && user?.id && !requestBody.ownerId) {
        requestBody.ownerId = user.id;
        console.log('Auto-applied owner filter for owner user:', user.id);
      }

      // Log request for debugging
      console.log('PDF Generation Request:', {
        url: edgeFunctionUrl,
        body: requestBody,
      });

      // Call Supabase edge function
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('PDF Generation Response:', {
        status: response.status,
        contentType: response.headers.get('content-type'),
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate report' }));
        console.error('PDF Generation Error:', errorData);
        throw new Error(errorData.error || 'Failed to generate report');
      }

      // Check if response is actually a PDF or HTML
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('text/html')) {
        // Edge function returned HTML fallback - convert to PDF using browser print
        console.log('Converting HTML to PDF using browser print...');
        let htmlContent = await response.text();

        // Convert Arabic-Indic numerals to Western numerals
        // Arabic-Indic: ٠١٢٣٤٥٦٧٨٩ (U+0660 to U+0669)
        // Extended Arabic-Indic: ۰۱۲۳۴۵۶۷۸۹ (U+06F0 to U+06F9)
        htmlContent = htmlContent
          .replace(/[\u0660-\u0669]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x0030))
          .replace(/[\u06F0-\u06F9]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 0x0030));

        // Add CSS to force Western numerals and disable Hijri dates
        const styleTag = `
          <style>
            * {
              font-variant-numeric: lining-nums !important;
            }
            body {
              -webkit-locale: "en-US" !important;
            }
          </style>
        `;
        htmlContent = htmlContent.replace('</head>', styleTag + '</head>');

        // Create a hidden iframe to load the HTML and trigger print
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        // Write HTML content to iframe
        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(htmlContent);
          iframeDoc.close();

          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 500));

          // Trigger browser print dialog (user can save as PDF)
          iframe.contentWindow?.print();

          // Clean up after a delay
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);

          setSuccess(t('common:success'));
          return;
        }
      }

      if (contentType && !contentType.includes('application/pdf')) {
        // Not a PDF or HTML, it's an error
        const errorText = await response.text();
        console.error('Unexpected response type:', contentType, errorText);
        throw new Error(`Server returned ${contentType}. Response: ${errorText.substring(0, 200)}`);
      }

      // Get the PDF blob (if it's already a PDF)
      const blob = await response.blob();
      console.log('PDF Blob size:', blob.size, 'bytes');

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(t('common:success'));
    } catch (err) {
      console.error('Error downloading report:', err);
      setError(err instanceof Error ? err.message : 'Failed to download report');
    } finally {
      setLoadingReport(null);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {t('title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('subtitle')}
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title={t('totalReports')}
            value={stats.total}
            icon={<FileText />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title={t('financial')}
            value={stats.financial}
            icon={<DollarSign />}
            color="success"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title={t('properties')}
            value={stats.property}
            icon={<Building2 />}
            color="info"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title={t('tenants')}
            value={stats.tenant}
            icon={<Users />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Category Tabs */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: { xs: 40, sm: 48 },
            '& .MuiTabs-scrollButtons': {
              width: { xs: 32, sm: 40 },
            },
          }}
        >
          {categories.map((category, index) => (
            <Tab
              key={category.value}
              icon={isMobile ? category.icon : undefined}
              iconPosition="start"
              sx={{
                minHeight: { xs: 40, sm: 48 },
                px: { xs: 1, sm: 2 },
                minWidth: { xs: 60, sm: 90 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
              label={
                isMobile ? undefined : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {category.icon}
                    <Typography variant="body2">{category.label}</Typography>
                  </Box>
                )
              }
            />
          ))}
        </Tabs>
      </Card>

      {/* Reports Grid */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
        {filteredReports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 2, md: 2 } }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  mb: { xs: 1.5, sm: 2 },
                  gap: 1,
                }}>
                  <Typography
                    variant={isMobile ? 'subtitle1' : 'h6'}
                    sx={{ fontWeight: 'bold', flexGrow: 1, lineHeight: 1.3 }}
                  >
                    {report.name}
                  </Typography>
                  <Chip
                    label={t(`categories.${report.category}`)}
                    color={categoryColors[report.category]}
                    size="small"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '0.875rem', sm: '0.875rem' },
                    lineHeight: 1.5,
                  }}
                >
                  {report.description}
                </Typography>

                {report.lastGenerated && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    {t('lastGenerated')}: {formatDate(report.lastGenerated)}
                  </Typography>
                )}
              </CardContent>

              <Box sx={{
                p: { xs: 1.5, sm: 2 },
                pt: 0,
                display: 'flex',
                gap: { xs: 1, sm: 1 },
                flexDirection: { xs: 'column', sm: 'row' },
              }}>
                {isMobile ? (
                  <>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Filter size={16} />}
                      size="small"
                      sx={{ py: 1 }}
                      onClick={() => handleOpenFilterDialog(report.id)}
                    >
                      {t('common:filter')}
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={loadingReport === report.id ? <CircularProgress size={16} color="inherit" /> : <Download size={16} />}
                      size="small"
                      sx={{ py: 1 }}
                      onClick={() => handleDownloadReport(report.id)}
                      disabled={loadingReport === report.id}
                    >
                      {t('download')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Tooltip title={t('common:filter')}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenFilterDialog(report.id)}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          '&:hover': { borderColor: 'primary.main' }
                        }}
                      >
                        <Filter size={18} />
                      </IconButton>
                    </Tooltip>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Eye size={18} />}
                      size="small"
                      onClick={() => handleViewReport(report.id)}
                    >
                      {t('view')}
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={loadingReport === report.id ? <CircularProgress size={18} color="inherit" /> : <Download size={18} />}
                      size="small"
                      onClick={() => handleDownloadReport(report.id)}
                      disabled={loadingReport === report.id}
                    >
                      {t('download')}
                    </Button>
                  </>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('noReportsAvailable')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('noReportsDesc')}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={handleCloseFilterDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Filter size={24} />
            <Typography variant="h6">{t('common:filter')} {t('common:settings')}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Date Range */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                {t('common:dateRange')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('common:from')}
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      // Force Gregorian calendar format
                      pattern: "\\d{4}-\\d{2}-\\d{2}",
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('common:to')}
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      // Force Gregorian calendar format
                      pattern: "\\d{4}-\\d{2}-\\d{2}",
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Property Filter */}
            <FormControl fullWidth>
              <InputLabel>{t('common:property')}</InputLabel>
              <Select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                label={t('common:property')}
              >
                <MenuItem value="">
                  <em>{t('common:all')} {t('common:properties')}</em>
                </MenuItem>
                {properties.map((property) => (
                  <MenuItem key={property.id} value={property.id}>
                    {property.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Tenant Filter */}
            <FormControl fullWidth>
              <InputLabel>{t('common:tenant')}</InputLabel>
              <Select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                label={t('common:tenant')}
              >
                <MenuItem value="">
                  <em>{t('common:all')} {t('common:tenants')}</em>
                </MenuItem>
                {tenants.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.first_name} {tenant.last_name} ({tenant.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Owner Filter - Only show for admin/manager, not for owners */}
            {user?.role !== 'owner' && (
              <FormControl fullWidth>
                <InputLabel>{t('common:owner')}</InputLabel>
                <Select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  label={t('common:owner')}
                >
                  <MenuItem value="">
                    <em>{t('common:all')} {t('common:owners')}</em>
                  </MenuItem>
                  {owners.map((owner) => (
                    <MenuItem key={owner.id} value={owner.id}>
                      {owner.first_name} {owner.last_name} ({owner.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleCloseFilterDialog} color="inherit">
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleDownloadWithFilters}
            variant="contained"
            startIcon={<Download size={18} />}
          >
            {t('download')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
