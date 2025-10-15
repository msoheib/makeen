import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useMediaQuery,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Build as MaintenanceIcon,
  AttachMoney as FinanceIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAppStore } from '../../../lib/store';

interface ResponsiveSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  roles?: string[];
  children?: NavItem[];
}

export default function ResponsiveSidebar({ open, onClose }: ResponsiveSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAppStore();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  // Navigation items based on user role
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      id: 'properties',
      label: t('navigation.properties'),
      icon: <HomeIcon />,
      path: '/dashboard/properties',
      roles: ['admin', 'manager', 'owner'],
    },
    {
      id: 'tenants',
      label: t('navigation.tenants'),
      icon: <PeopleIcon />,
      path: '/dashboard/tenants',
      roles: ['admin', 'manager'],
    },
    {
      id: 'maintenance',
      label: t('navigation.maintenance'),
      icon: <MaintenanceIcon />,
      path: '/dashboard/maintenance',
    },
    {
      id: 'finance',
      label: t('navigation.finance'),
      icon: <FinanceIcon />,
      path: '/dashboard/finance',
      roles: ['admin', 'manager', 'accountant', 'owner'],
      children: [
        {
          id: 'finance-vouchers',
          label: t('navigation.vouchers'),
          icon: <FinanceIcon />,
          path: '/dashboard/finance/vouchers',
        },
        {
          id: 'finance-invoices',
          label: t('navigation.invoices'),
          icon: <FinanceIcon />,
          path: '/dashboard/finance/invoices',
        },
      ],
    },
    {
      id: 'reports',
      label: t('navigation.reports'),
      icon: <ReportsIcon />,
      path: '/dashboard/reports',
      roles: ['admin', 'manager', 'accountant', 'owner'],
    },
    {
      id: 'settings',
      label: t('navigation.settings'),
      icon: <SettingsIcon />,
      path: '/dashboard/settings',
    },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  });

  const isActive = (path: string) => location.pathname === path;

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.path);

    return (
      <Box key={item.id}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleToggle(item.id);
              } else {
                handleNavigation(item.path);
              }
            }}
            selected={active}
            sx={{
              minHeight: 48,
              pl: depth * 2 + 2,
              pr: 2,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 2,
                justifyContent: 'center',
                color: active ? 'inherit' : 'text.secondary',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: active ? 600 : 400,
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>

        {/* Render children */}
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Toolbar spacing for desktop */}
      {!isMobile && <Box sx={{ height: 64 }} />}

      {/* Navigation items */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2 }}>
        <List>{filteredNavItems.map((item) => renderNavItem(item))}</List>
      </Box>

      <Divider />

      {/* Footer info */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 1,
            p: 1.5,
            textAlign: 'center',
          }}
        >
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {user?.first_name} {user?.last_name}
          </Box>
          <Box sx={{ fontSize: '0.625rem', color: 'text.disabled', mt: 0.5 }}>
            {t(`roles.${user?.role}`)}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
