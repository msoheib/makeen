import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  User,
  Bell,
  Globe,
  Palette,
  HelpCircle,
  Shield,
  FileText,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { supabase } from '../../../lib/supabase';

export default function SettingsPage() {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { language, setLanguage, isDarkMode, setTheme } = useAppStore();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLanguageToggle = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  const accountSettings = [
    {
      icon: <User size={24} />,
      title: t('profile.title'),
      description: t('profile.description'),
      action: () => navigate('/dashboard/profile'),
    },
    {
      icon: <Bell size={24} />,
      title: t('notifications.title'),
      description: t('notifications.description'),
      action: () => {
        alert(
          language === 'ar'
            ? 'ميزة الإشعارات قريباً\n\nتم التطوير بواسطة POI'
            : 'Notifications feature coming soon\n\nDeveloped by POI'
        );
      },
    },
  ];

  const appSettings = [
    {
      icon: <Globe size={24} />,
      title: t('language.title'),
      description: t('language.description'),
      action: handleLanguageToggle,
      toggle: true,
      toggleValue: language === 'ar',
      toggleLabel: language === 'ar' ? 'العربية' : 'English',
    },
    {
      icon: <Palette size={24} />,
      title: t('theme.title'),
      description: t('theme.description'),
      action: handleThemeToggle,
      toggle: true,
      toggleValue: isDarkMode,
      toggleLabel: isDarkMode
        ? (language === 'ar' ? 'داكن' : 'Dark')
        : (language === 'ar' ? 'فاتح' : 'Light'),
    },
  ];

  const helpSettings = [
    {
      icon: <HelpCircle size={24} />,
      title: t('support.title'),
      description: t('support.description'),
      action: () => {
        // Open WhatsApp with prefilled support message
        const phoneNumber = '966556111029'; // Support WhatsApp number
        const message = encodeURIComponent(
          language === 'ar'
            ? 'مرحباً، أحتاج إلى مساعدة بخصوص نظام مكين لإدارة العقارات.'
            : 'Hello, I need help with Makeen Property Management System.'
        );
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
      },
    },
    {
      icon: <Shield size={24} />,
      title: t('privacy.title'),
      description: t('privacy.description'),
      action: () => {
        alert(
          language === 'ar'
            ? 'صفحة سياسة الخصوصية قريباً\n\nتم التطوير بواسطة POI'
            : 'Privacy policy page coming soon\n\nDeveloped by POI'
        );
      },
    },
    {
      icon: <FileText size={24} />,
      title: t('terms.title'),
      description: t('terms.description'),
      action: () => {
        alert(
          language === 'ar'
            ? 'صفحة شروط الخدمة قريباً\n\nتم التطوير بواسطة POI'
            : 'Terms of service page coming soon\n\nDeveloped by POI'
        );
      },
    },
    {
      icon: <Info size={24} />,
      title: t('about.title'),
      description: t('about.description'),
      action: () => {
        alert(
          language === 'ar'
            ? 'نظام مكين لإدارة العقارات\nالإصدار 1.0.0\n\nتم التطوير بواسطة POI'
            : 'Makeen Property Management System\nVersion 1.0.0\n\nDeveloped by POI'
        );
      },
    },
  ];

  return (
    <Box dir={language === 'ar' ? 'rtl' : 'ltr'} sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          {t('title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('subtitle')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Account Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                {t('accountSettings')}
              </Typography>
              <List disablePadding>
                {accountSettings.map((setting, index) => (
                  <Box key={setting.title}>
                    {index > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton onClick={setting.action}>
                        <ListItemIcon>{setting.icon}</ListItemIcon>
                        <ListItemText
                          primary={setting.title}
                          secondary={setting.description}
                          primaryTypographyProps={{ align: language === 'ar' ? 'right' : 'left' }}
                          secondaryTypographyProps={{ align: language === 'ar' ? 'right' : 'left' }}
                        />
                        <ChevronRight size={20} />
                      </ListItemButton>
                    </ListItem>
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* App Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                {t('appSettings')}
              </Typography>
              <List disablePadding>
                {appSettings.map((setting, index) => (
                  <Box key={setting.title}>
                    {index > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton onClick={setting.toggle ? undefined : setting.action}>
                        <ListItemIcon>{setting.icon}</ListItemIcon>
                        <ListItemText
                          primary={setting.title}
                          secondary={setting.description}
                          primaryTypographyProps={{ align: language === 'ar' ? 'right' : 'left' }}
                          secondaryTypographyProps={{ align: language === 'ar' ? 'right' : 'left' }}
                        />
                        {setting.toggle ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {setting.toggleLabel}
                            </Typography>
                            <Switch
                              checked={setting.toggleValue}
                              onChange={setting.action}
                            />
                          </Box>
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </ListItemButton>
                    </ListItem>
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Help & Legal */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                {t('helpSection')}
              </Typography>
              <List disablePadding>
                {helpSettings.map((setting, index) => (
                  <Box key={setting.title}>
                    {index > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton onClick={setting.action}>
                        <ListItemIcon>{setting.icon}</ListItemIcon>
                        <ListItemText
                          primary={setting.title}
                          secondary={setting.description}
                          primaryTypographyProps={{ align: language === 'ar' ? 'right' : 'left' }}
                          secondaryTypographyProps={{ align: language === 'ar' ? 'right' : 'left' }}
                        />
                        <ChevronRight size={20} />
                      </ListItemButton>
                    </ListItem>
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Logout Button */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<LogOut size={20} />}
                onClick={() => setLogoutDialogOpen(true)}
                sx={{ py: 1.5 }}
              >
                {t('logout')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* App Version */}
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {t('version')} 1.0.0
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <DialogTitle>{t('logoutConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('logoutConfirmMessage')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>
            {t('common:cancel')}
          </Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            {t('logout')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
