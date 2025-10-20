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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Search, Plus, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import StatCard from '../../components/data/StatCard';

interface Invoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  vat_amount: number;
  total_amount: number;
  issue_date: string;
  due_date: string;
  property_name: string;
  tenant_name: string;
  description: string;
}

export default function InvoicesList() {
  const { t } = useTranslation(['finance', 'common']);
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Simulate loading invoices
    setTimeout(() => {
      setInvoices(mockInvoices);
      setLoading(false);
    }, 500);
  }, []);

  const mockInvoices: Invoice[] = [
    {
      id: '1',
      invoice_number: 'INV-2024-001',
      status: 'paid',
      amount: 5000,
      vat_amount: 750,
      total_amount: 5750,
      issue_date: '2024-01-01',
      due_date: '2024-01-05',
      property_name: 'Apartment 205 - Downtown',
      tenant_name: 'Ahmed Al-Mansour',
      description: 'Monthly rent - January 2024',
    },
    {
      id: '2',
      invoice_number: 'INV-2024-002',
      status: 'sent',
      amount: 4500,
      vat_amount: 675,
      total_amount: 5175,
      issue_date: '2024-02-01',
      due_date: '2024-02-05',
      property_name: 'Office Space 3A',
      tenant_name: 'Sarah Khalid',
      description: 'Monthly rent - February 2024',
    },
    {
      id: '3',
      invoice_number: 'INV-2024-003',
      status: 'overdue',
      amount: 6000,
      vat_amount: 900,
      total_amount: 6900,
      issue_date: '2024-01-20',
      due_date: '2024-01-25',
      property_name: 'Villa 12 - Suburb Area',
      tenant_name: 'Mohammed Hassan',
      description: 'Monthly rent + utilities - January 2024',
    },
    {
      id: '4',
      invoice_number: 'INV-2024-004',
      status: 'draft',
      amount: 5200,
      vat_amount: 780,
      total_amount: 5980,
      issue_date: '2024-03-01',
      due_date: '2024-03-05',
      property_name: 'Retail Shop 7',
      tenant_name: 'Fatima Ali',
      description: 'Monthly rent - March 2024',
    },
  ];

  const stats = {
    total: invoices.length,
    sent: invoices.filter((inv) => inv.status === 'sent').length,
    paid: invoices.filter((inv) => inv.status === 'paid').length,
    overdue: invoices.filter((inv) => inv.status === 'overdue').length,
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.property_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    draft: 'default',
    sent: 'info',
    paid: 'success',
    overdue: 'error',
    cancelled: 'default',
  } as const;

  const statusIcons = {
    draft: <FileText size={20} />,
    sent: <Clock size={20} />,
    paid: <CheckCircle size={20} />,
    overdue: <AlertCircle size={20} />,
    cancelled: <FileText size={20} />,
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{t('loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          {t('invoices')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('subtitle')}
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('totalTransactions')}
            value={stats.total}
            icon={<FileText />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('invoiceStatuses.sent')}
            value={stats.sent}
            icon={<Clock />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('invoiceStatuses.paid')}
            value={stats.paid}
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('overdueInvoices')}
            value={stats.overdue}
            icon={<AlertCircle />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>{t('filterByStatus')}</InputLabel>
                <Select
                  value={filterStatus}
                  label={t('filterByStatus')}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">{t('common:all')}</MenuItem>
                  <MenuItem value="draft">{t('invoiceStatuses.draft')}</MenuItem>
                  <MenuItem value="sent">{t('invoiceStatuses.sent')}</MenuItem>
                  <MenuItem value="paid">{t('invoiceStatuses.paid')}</MenuItem>
                  <MenuItem value="overdue">{t('invoiceStatuses.overdue')}</MenuItem>
                  <MenuItem value="cancelled">{t('invoiceStatuses.cancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Plus size={20} />}
                sx={{ height: '56px' }}
                onClick={() => alert(t('common:comingSoon'))}
              >
                {t('addInvoice')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Grid container spacing={2}>
        {filteredInvoices.map((invoice) => (
          <Grid item xs={12} key={invoice.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {statusIcons[invoice.status]}
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {invoice.invoice_number}
                    </Typography>
                  </Box>
                  <Chip
                    label={t(`invoiceStatuses.${invoice.status}`)}
                    color={statusColors[invoice.status]}
                    size="small"
                  />
                </Box>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  {invoice.description}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      {t('tenant')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {invoice.tenant_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      {t('property')}
                    </Typography>
                    <Typography variant="body2">{invoice.property_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="caption" color="text.secondary">
                      {t('amount')}
                    </Typography>
                    <Typography variant="body2">
                      {invoice.amount.toLocaleString()} {t('common:currency')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="caption" color="text.secondary">
                      {t('vatAmount')}
                    </Typography>
                    <Typography variant="body2">
                      {invoice.vat_amount.toLocaleString()} {t('common:currency')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="caption" color="text.secondary">
                      {t('totalAmount')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {invoice.total_amount.toLocaleString()} {t('common:currency')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      {t('issueDate')}
                    </Typography>
                    <Typography variant="body2">
                      {new Date(invoice.issue_date).toLocaleDateString('ar-SA')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      {t('dueDate')}
                    </Typography>
                    <Typography variant="body2">
                      {new Date(invoice.due_date).toLocaleDateString('ar-SA')}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('noTransactionsFound')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('adjustSearch')}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
