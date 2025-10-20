import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ResponsiveContainer from '../../components/layout/ResponsiveContainer';
import StatCard from '../../components/data/StatCard';
import { profilesApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { formatDate } from '../../../lib/dateUtils';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { t } = useTranslation(['profile', 'common']);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editedProfile, setEditedProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Saudi Arabia',
  });

  // Fetch current user profile from Supabase
  const { 
    data: profile, 
    loading, 
    error, 
    refetch 
  } = useApi(async () => {
    const res = await profilesApi.getCurrentUser();
    // Surface clearer error when unauthenticated or profile missing
    if (res.error && res.error.details === 'AUTH_ERROR') {
      throw new Error(t('common:auth.sessionExpired') || 'Session expired');
    }
    return res;
  }, [t]);

  // Show error message if API call fails
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  // Update edited profile when database profile loads
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || 'Saudi Arabia',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!editedProfile.first_name.trim() || !editedProfile.last_name.trim()) {
      setErrorMessage('Name is required');
      return;
    }

    if (!editedProfile.email.trim()) {
      setErrorMessage('Email is required');
      return;
    }

    setSaving(true);
    try {
      if (!profile?.id) {
        setErrorMessage(t('common:somethingWentWrong'));
        setSaving(false);
        return;
      }

      const success = await profilesApi.update(profile.id, {
        first_name: editedProfile.first_name,
        last_name: editedProfile.last_name,
        email: editedProfile.email,
        phone: editedProfile.phone,
        address: editedProfile.address,
        city: editedProfile.city,
        country: editedProfile.country,
      });

      if (success.data) {
        setIsEditing(false);
        setErrorMessage(null);
        refetch(); // Refresh the profile data
      } else {
        setErrorMessage(success.error?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Profile save error:', err);
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditedProfile({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || 'Saudi Arabia',
      });
    }
    setIsEditing(false);
    setErrorMessage(null);
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName.trim()[0] || '';
    const last = lastName.trim()[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getFullName = () => {
    return `${editedProfile.first_name} ${editedProfile.last_name}`.trim() || t('user');
  };

  // Calculate stats (mock data for now)
  const stats = {
    propertiesManaged: 0,
    activeTenants: 0,
    accountType: 'Standard',
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
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            {t('myProfile')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('manageYourAccount')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refetch}
            disabled={loading}
            sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
          >
            {t('common:refresh')}
          </Button>

          {!isEditing ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              {t('edit')}
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={saving}
              >
                {t('common:cancel')}
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                loading={saving}
              >
                {saving ? t('saving') : t('save')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Profile Header */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}05)` }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 'bold',
              }}
            >
              {getInitials(editedProfile.first_name, editedProfile.last_name)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {getFullName()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {editedProfile.email || t('noEmail')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={profile?.role || t('realEstateProfessional')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={profile?.status || 'Active'}
                  size="small"
                  color={profile?.status === 'active' ? 'success' : 'default'}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title={t('propertiesManaged')}
            value={stats.propertiesManaged}
            icon={<BusinessIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title={t('activeTenants')}
            value={stats.activeTenants}
            icon={<PersonIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title={t('accountType')}
            value={stats.accountType}
            icon={<SecurityIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Profile Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {t('personalInformation')}
          </Typography>

          <Grid container spacing={3}>
            {/* Name Fields */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('firstName')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editedProfile.first_name}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder={t('enterFirstName')}
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Typography variant="body1">
                  {editedProfile.first_name || t('notProvided')}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('lastName')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editedProfile.last_name}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder={t('enterLastName')}
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Typography variant="body1">
                  {editedProfile.last_name || t('notProvided')}
                </Typography>
              )}
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmailIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('emailAddress')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('enterEmail')}
                  type="email"
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Typography variant="body1">
                  {editedProfile.email || t('notProvided')}
                </Typography>
              )}
            </Grid>

            {/* Phone */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PhoneIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('phoneNumber')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t('enterPhone')}
                  type="tel"
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Typography variant="body1">
                  {editedProfile.phone || t('notProvided')}
                </Typography>
              )}
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('address')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editedProfile.address}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t('enterAddress')}
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Typography variant="body1">
                  {editedProfile.address || t('notProvided')}
                </Typography>
              )}
            </Grid>

            {/* City and Country */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('city')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editedProfile.city}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, city: e.target.value }))}
                  placeholder={t('enterCity')}
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Typography variant="body1">
                  {editedProfile.city || t('notProvided')}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('country')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editedProfile.country}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, country: e.target.value }))}
                  placeholder={t('enterCountry')}
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Typography variant="body1">
                  {editedProfile.country || t('notProvided')}
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {t('accountInformation')}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('userID')}
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {profile?.id || t('notAvailable')}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('role')}
              </Typography>
              <Typography variant="body1">
                {profile?.role || t('notAvailable')}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('status')}
              </Typography>
              <Chip
                label={profile?.status || 'Unknown'}
                color={profile?.status === 'active' ? 'success' : 'default'}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('memberSince')}
              </Typography>
              <Typography variant="body1">
                {profile?.created_at ? formatDate(profile.created_at) : t('notAvailable')}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}
