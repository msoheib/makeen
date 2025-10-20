import { Card, CardContent, Typography, Box, useTheme, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  loading?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  loading = false,
  onClick,
}: StatCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');

  const colorMap = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  };

  const selectedColor = colorMap[color];

  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          minHeight: { xs: '120px', sm: '140px' },
        }}
      >
        <CardContent>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        minHeight: { xs: '100px', sm: '140px' },
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4],
            }
          : {},
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        {/* Header with title and icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: { xs: 0.5, sm: 2 },
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.65rem', sm: '0.875rem' },
              fontWeight: 500,
              letterSpacing: '0.5px',
              lineHeight: { xs: 1.2, sm: 1.4 },
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: '50%',
                bgcolor: `${selectedColor}15`,
                color: selectedColor,
                '& svg': {
                  fontSize: { xs: '1.1rem', sm: '1.5rem' },
                },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {/* Value */}
        <Typography
          variant="h4"
          component="div"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: trend ? 1 : 0,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
            lineHeight: 1.2,
          }}
        >
          {value}
        </Typography>

        {/* Trend indicator */}
        {trend && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {trend.isPositive ? (
              <TrendingUp sx={{ fontSize: { xs: 16, sm: 18 }, color: 'success.main' }} />
            ) : (
              <TrendingDown sx={{ fontSize: { xs: 16, sm: 18 }, color: 'error.main' }} />
            )}
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                color: trend.isPositive ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {trend.value > 0 ? '+' : ''}
              {trend.value}%
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: { xs: '0.625rem', sm: '0.75rem' },
                color: 'text.secondary',
                ml: 0.5,
              }}
            >
              {t('vsLastMonth', 'vs last month')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Shimmer loading component for stat cards
export function StatCardSkeleton() {
  return (
    <Card
      sx={{
        height: '100%',
        minHeight: { xs: '120px', sm: '140px' },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
        <Skeleton variant="text" width="80%" height={48} />
        <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
}
