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
import { Search, Plus, Receipt, FileText, BookOpen } from 'lucide-react';
import StatCard from '../../components/data/StatCard';

interface Voucher {
  id: string;
  voucher_number: string;
  type: 'receipt' | 'payment' | 'journal';
  status: 'draft' | 'posted' | 'cancelled';
  amount: number;
  description: string;
  date: string;
  property_name?: string;
  account_name: string;
}

export default function VouchersList() {
  const { t } = useTranslation(['finance', 'common']);
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Simulate loading vouchers
    setTimeout(() => {
      setVouchers(mockVouchers);
      setLoading(false);
    }, 500);
  }, []);

  const mockVouchers: Voucher[] = [
    {
      id: '1',
      voucher_number: 'RCV-2024-001',
      type: 'receipt',
      status: 'posted',
      amount: 5000,
      description: 'Monthly rent payment - January 2024',
      date: '2024-01-05',
      property_name: 'Apartment 205 - Downtown',
      account_name: 'Rental Income',
    },
    {
      id: '2',
      voucher_number: 'PAY-2024-001',
      type: 'payment',
      status: 'posted',
      amount: 1500,
      description: 'Maintenance expenses - Plumbing repair',
      date: '2024-01-10',
      property_name: 'Villa 12 - Suburb Area',
      account_name: 'Maintenance Expenses',
    },
    {
      id: '3',
      voucher_number: 'JRN-2024-001',
      type: 'journal',
      status: 'draft',
      amount: 3000,
      description: 'Depreciation entry for January',
      date: '2024-01-31',
      account_name: 'Depreciation',
    },
    {
      id: '4',
      voucher_number: 'RCV-2024-002',
      type: 'receipt',
      status: 'posted',
      amount: 4500,
      description: 'Monthly rent payment - February 2024',
      date: '2024-02-05',
      property_name: 'Office Space 3A',
      account_name: 'Rental Income',
    },
  ];

  const stats = {
    total: vouchers.length,
    receipts: vouchers.filter((v) => v.type === 'receipt').length,
    payments: vouchers.filter((v) => v.type === 'payment').length,
    drafts: vouchers.filter((v) => v.status === 'draft').length,
  };

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      voucher.voucher_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.account_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || voucher.type === filterType;
    const matchesStatus = filterStatus === 'all' || voucher.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const typeColors = {
    receipt: 'success',
    payment: 'error',
    journal: 'info',
  } as const;

  const statusColors = {
    draft: 'default',
    posted: 'success',
    cancelled: 'error',
  } as const;

  const typeIcons = {
    receipt: <Receipt size={20} />,
    payment: <FileText size={20} />,
    journal: <BookOpen size={20} />,
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
          {t('vouchers')}
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
            title={t('receipts')}
            value={stats.receipts}
            icon={<Receipt />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('payments')}
            value={stats.payments}
            icon={<FileText />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('voucherStatuses.draft')}
            value={stats.drafts}
            icon={<BookOpen />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('filterByType')}</InputLabel>
                <Select
                  value={filterType}
                  label={t('filterByType')}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">{t('common:all')}</MenuItem>
                  <MenuItem value="receipt">{t('voucherTypes.receipt')}</MenuItem>
                  <MenuItem value="payment">{t('voucherTypes.payment')}</MenuItem>
                  <MenuItem value="journal">{t('voucherTypes.journal')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('filterByStatus')}</InputLabel>
                <Select
                  value={filterStatus}
                  label={t('filterByStatus')}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">{t('common:all')}</MenuItem>
                  <MenuItem value="draft">{t('voucherStatuses.draft')}</MenuItem>
                  <MenuItem value="posted">{t('voucherStatuses.posted')}</MenuItem>
                  <MenuItem value="cancelled">{t('voucherStatuses.cancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Plus size={20} />}
                sx={{ height: '56px' }}
                onClick={() => alert(t('common:comingSoon'))}
              >
                {t('addVoucher')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Vouchers List */}
      <Grid container spacing={2}>
        {filteredVouchers.map((voucher) => (
          <Grid item xs={12} key={voucher.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {typeIcons[voucher.type]}
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {voucher.voucher_number}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={t(`voucherTypes.${voucher.type}`)}
                      color={typeColors[voucher.type]}
                      size="small"
                    />
                    <Chip
                      label={t(`voucherStatuses.${voucher.status}`)}
                      color={statusColors[voucher.status]}
                      size="small"
                    />
                  </Box>
                </Box>

                <Typography variant="body1" sx={{ mb: 1 }}>
                  {voucher.description}
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('amount')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {voucher.amount.toLocaleString()} {t('common:currency')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('account')}
                    </Typography>
                    <Typography variant="body2">{voucher.account_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('date')}
                    </Typography>
                    <Typography variant="body2">
                      {new Date(voucher.date).toLocaleDateString('en-US')}
                    </Typography>
                  </Grid>
                  {voucher.property_name && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        {t('property')}
                      </Typography>
                      <Typography variant="body2">{voucher.property_name}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredVouchers.length === 0 && (
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
