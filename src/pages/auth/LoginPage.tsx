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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useAppStore } from '../../../lib/store';

// RTL helper
const isRTL = (lang: string) => lang === 'ar';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const rtl = isRTL(i18n.language);
  const { setUser, setAuthenticated } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        console.log('[LoginPage] User signed in:', data.user.email);

        // Fetch user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('[LoginPage] Error fetching profile:', profileError);
          throw profileError;
        }

        if (!profile) {
          console.error('[LoginPage] No profile found for user');
          throw new Error('Profile not found');
        }

        console.log('[LoginPage] Profile fetched:', {
          email: profile.email,
          role: profile.role,
          approval_status: profile.approval_status,
          status: profile.status,
        });

        // Check approval and account status
        const isApproved = profile.approval_status === 'approved';
        const isActive = profile.status !== 'inactive' && profile.status !== 'suspended';

        if (!isApproved || !isActive) {
          console.warn('[LoginPage] Account validation failed:', {
            isApproved,
            isActive,
            approval_status: profile.approval_status,
            status: profile.status,
          });
          setError(t('auth.errors.accountNotApproved'));
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        console.log('[LoginPage] Authentication successful, setting user and navigating');
        setUser(profile);
        setAuthenticated(true);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || t('auth.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" dir={rtl ? 'rtl' : 'ltr'}>
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: rtl ? 'right' : 'left',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: rtl ? 'right' : 'left' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" gutterBottom color="primary" fontWeight="bold">
              Makeen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('auth.propertyManagement')}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('auth.email')}
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('auth.password')}
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                t('auth.signIn')
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link to="/auth/signup" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  {t('auth.noAccount')} {t('auth.signUp')}
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
