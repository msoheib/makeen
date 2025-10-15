import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase.web';

export default function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'tenant' as const,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError(t('auth.errors.passwordTooShort'));
      setLoading(false);
      return;
    }

    try {
      // Sign up with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          role: formData.role,
          status: 'pending', // Requires admin approval
        });

        if (profileError) throw profileError;

        setSuccess(true);
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || t('auth.errors.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container component="main" maxWidth="xs">
        <Box sx={{ marginTop: 8 }}>
          <Paper elevation={3} sx={{ padding: 4 }}>
            <Alert severity="success">
              {t('auth.success.accountCreated')}
              <br />
              {t('auth.success.awaitingApproval')}
            </Alert>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8 }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom color="primary">
            {t('auth.createAccount')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                required
                name="firstName"
                label={t('auth.firstName')}
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
              />
              <TextField
                required
                name="lastName"
                label={t('auth.lastName')}
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
              />
            </Box>

            <TextField
              margin="normal"
              required
              fullWidth
              name="email"
              label={t('auth.email')}
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              fullWidth
              name="phoneNumber"
              label={t('auth.phoneNumber')}
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              select
              name="role"
              label={t('auth.role')}
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <MenuItem value="tenant">{t('roles.tenant')}</MenuItem>
              <MenuItem value="owner">{t('roles.owner')}</MenuItem>
              <MenuItem value="buyer">{t('roles.buyer')}</MenuItem>
            </TextField>

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('auth.password')}
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label={t('auth.confirmPassword')}
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : t('auth.signUp')}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link to="/auth/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  {t('auth.haveAccount')} {t('auth.signIn')}
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
