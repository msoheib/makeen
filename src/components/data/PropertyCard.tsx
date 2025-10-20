import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  Home as HomeIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PropertyCardProps {
  id: string;
  title: string;
  address: string;
  city: string;
  propertyType: string;
  status: 'available' | 'rented' | 'maintenance' | 'reserved';
  price: number;
  imageUrl?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  loading?: boolean;
  onEdit?: () => void;
  onView?: () => void;
}

const statusColors = {
  available: 'success',
  rented: 'primary',
  maintenance: 'warning',
  reserved: 'info',
} as const;

export default function PropertyCard({
  id,
  title,
  address,
  city,
  propertyType,
  status,
  price,
  imageUrl,
  bedrooms,
  bathrooms,
  area,
  loading = false,
  onEdit,
  onView,
}: PropertyCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation(['properties', 'common']);

  const handleView = () => {
    if (onView) {
      onView();
    } else {
      navigate(`/dashboard/properties/${id}`);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      navigate(`/dashboard/properties/${id}/edit`);
    }
  };

  if (loading) {
    return <PropertyCardSkeleton />;
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      {/* Property Image */}
      <CardMedia
        component="div"
        sx={{
          position: 'relative',
          height: { xs: 180, sm: 200 },
          bgcolor: 'grey.200',
          overflow: 'hidden',
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              // Fallback to placeholder on error
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.300',
            }}
          >
            <HomeIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: 'grey.500' }} />
          </Box>
        )}

        {/* Status Badge */}
        <Chip
          label={t(`status.${status}`)}
          color={statusColors[status]}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontWeight: 600,
            fontSize: { xs: '0.625rem', sm: '0.75rem' },
          }}
        />

        {/* Property Type Badge */}
        <Chip
          label={t(`types.${propertyType}`)}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            fontWeight: 500,
            fontSize: { xs: '0.625rem', sm: '0.75rem' },
          }}
        />
      </CardMedia>

      {/* Property Info */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Title */}
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.125rem' },
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </Typography>

        {/* Location */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1.5 }}>
          <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.25 }} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              lineHeight: 1.4,
            }}
          >
            {address}, {city}
          </Typography>
        </Box>

        {/* Property Details */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 1.5,
            flexWrap: 'wrap',
          }}
        >
          {bedrooms && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              🛏️ {bedrooms} {t('bedrooms')}
            </Typography>
          )}
          {bathrooms && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              🚿 {bathrooms} {t('bathrooms')}
            </Typography>
          )}
          {area && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              📐 {area} m²
            </Typography>
          )}
        </Box>

        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="h6"
            color="primary.main"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.125rem' },
            }}
          >
            {price.toLocaleString()} {t('common:currency')}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
          >
            / {t('perMonth')}
          </Typography>
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <IconButton
          size="small"
          onClick={handleView}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            mr: 1,
          }}
        >
          <ViewIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleEdit}
          sx={{
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
}

// Loading skeleton for PropertyCard
export function PropertyCardSkeleton() {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={200} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" width="80%" height={32} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Skeleton variant="text" width={60} height={20} />
          <Skeleton variant="text" width={60} height={20} />
          <Skeleton variant="text" width={60} height={20} />
        </Box>
        <Skeleton variant="text" width="40%" height={28} sx={{ mt: 2 }} />
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} sx={{ ml: 1 }} />
      </CardActions>
    </Card>
  );
}
