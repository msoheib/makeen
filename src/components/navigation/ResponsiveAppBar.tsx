import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Avatar,
  useMediaQuery,
  useTheme,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../../lib/store';

interface ResponsiveAppBarProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

export default function ResponsiveAppBar({
  onMenuClick,
  showMenuButton = true,
}: ResponsiveAppBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isDarkMode, toggleDarkMode, currentLanguage } = useAppStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langMenuAnchor, setLangMenuAnchor] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLangMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLangMenuAnchor(event.currentTarget);
  };

  const handleLangMenuClose = () => {
    setLangMenuAnchor(null);
  };

  const handleLanguageChange = async (lang: 'en' | 'ar') => {
    await useAppStore.getState().changeLanguage(lang);
    handleLangMenuClose();
  };

  const handleLogout = async () => {
    const { signOut } = await import('../../../lib/supabase.web');
    await signOut();
    navigate('/auth/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={isMobile ? 1 : 2}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: '56px', sm: '64px' },
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* Menu button - mobile/tablet */}
        {showMenuButton && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo/Title */}
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            flexGrow: 0,
            fontWeight: 700,
            color: 'primary.main',
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
          }}
        >
          Makeen
        </Typography>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right-side actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          {/* Language Toggle */}
          <IconButton
            color="inherit"
            onClick={handleLangMenuOpen}
            size={isMobile ? 'small' : 'medium'}
            aria-label="change language"
          >
            <LanguageIcon />
          </IconButton>
          <Menu
            anchorEl={langMenuAnchor}
            open={Boolean(langMenuAnchor)}
            onClose={handleLangMenuClose}
          >
            <MenuItem
              onClick={() => handleLanguageChange('en')}
              selected={currentLanguage === 'en'}
            >
              English
            </MenuItem>
            <MenuItem
              onClick={() => handleLanguageChange('ar')}
              selected={currentLanguage === 'ar'}
            >
              العربية
            </MenuItem>
          </Menu>

          {/* Dark Mode Toggle */}
          <IconButton
            color="inherit"
            onClick={toggleDarkMode}
            size={isMobile ? 'small' : 'medium'}
            aria-label="toggle dark mode"
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {/* Notifications */}
          <IconButton
            color="inherit"
            size={isMobile ? 'small' : 'medium'}
            onClick={() => navigate('/dashboard/notifications')}
            aria-label="notifications"
          >
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Profile */}
          <IconButton
            onClick={handleProfileMenuOpen}
            size="small"
            aria-label="user profile"
            sx={{ ml: { xs: 0.5, sm: 1 } }}
          >
            <Avatar
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                bgcolor: 'primary.main',
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => navigate('/dashboard/profile')}>
              {t('profile.title')}
            </MenuItem>
            <MenuItem onClick={() => navigate('/dashboard/settings')}>
              {t('settings.title')}
            </MenuItem>
            <MenuItem onClick={handleLogout}>{t('auth.logout')}</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
