import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disableGutters?: boolean;
  className?: string;
}

/**
 * Responsive container that adapts padding and max-width based on screen size
 * Mobile: Full-width with minimal padding
 * Tablet: Moderate padding
 * Desktop: Standard container with max-width
 */
export default function ResponsiveContainer({
  children,
  maxWidth = 'lg',
  disableGutters = false,
  className,
}: ResponsiveContainerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters || isMobile}
      className={className}
      sx={{
        px: {
          xs: disableGutters ? 0 : 2,  // 16px on mobile
          sm: disableGutters ? 0 : 3,  // 24px on tablet
          md: disableGutters ? 0 : 4,  // 32px on desktop
        },
        py: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      {children}
    </Container>
  );
}
