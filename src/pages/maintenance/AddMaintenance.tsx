import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  Alert,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  CircularProgress,
} from '@mui/material';
import { ArrowLeft, Building, AlertTriangle, Camera, X, Upload } from 'lucide-react';
import { propertiesApi } from '../../../lib/api';

interface Property {
  id: string;
  title: string;
  address: string;
  property_code?: string;
  status?: string;
}

export default function AddMaintenance() {
  const { t } = useTranslation(['maintenance', 'common']);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    property_id: '',
    images: [] as string[],
  });

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string) => (event: any) => {
    setFormData({ ...formData, [field]: event.target.value });
    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setFormData({ ...formData, property_id: property.id });
    setShowPropertyModal(false);
    if (errors.property_id) {
      setErrors({ ...errors, property_id: '' });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      if (formData.images.length + newImages.length < 5) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length || formData.images.length + newImages.length >= 5) {
            setFormData({ ...formData, images: [...formData.images, ...newImages] });
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('common:required');
    } else if (formData.title.trim().length < 5) {
      newErrors.title = t('common:minLength', { length: 5 });
    }

    if (!formData.description.trim()) {
      newErrors.description = t('common:required');
    }

    if (!formData.property_id) {
      newErrors.property_id = t('selectProperty') + ' ' + t('common:required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual API submission
      console.log('Form data:', formData);
      alert(t('common:success') + '! ' + t('requestCreated'));
      navigate('/dashboard/maintenance');
    } catch (error: any) {
      console.error('Error submitting maintenance request:', error);
      alert(t('common:error') + ': ' + (error.message || t('common:tryAgain')));
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string): 'primary' | 'warning' | 'error' => {
    switch (priority) {
      case 'low': return 'primary';
      case 'medium': return 'warning';
      case 'high': return 'warning';
      case 'urgent': return 'error';
      default: return 'primary';
    }
  };

  const getPriorityDescription = (priority: string) => {
    const descriptions: Record<string, string> = {
      low: t('priorityDescriptions.low'),
      medium: t('priorityDescriptions.medium'),
      high: t('priorityDescriptions.high'),
      urgent: t('priorityDescriptions.urgent'),
    };
    return descriptions[priority] || '';
  };

  // Load properties from database
  useEffect(() => {
    const fetchProperties = async () => {
      setPropertiesLoading(true);
      setPropertiesError(null);

      try {
        const response = await propertiesApi.getAll();

        if (response.error) {
          setPropertiesError(response.error.message || t('common:error'));
          setProperties([]);
        } else {
          setProperties(response.data || []);
        }
      } catch (error: any) {
        console.error('Error fetching properties:', error);
        setPropertiesError(error.message || t('common:error'));
        setProperties([]);
      } finally {
        setPropertiesLoading(false);
      }
    };

    fetchProperties();
  }, [t]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowLeft size={20} />}
          onClick={() => navigate('/dashboard/maintenance')}
        >
          {t('common:back')}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('addRequest')}
        </Typography>
      </Box>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Request Details Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AlertTriangle size={20} color="#1976d2" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('requestDetails')}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label={t('common:title')}
                      value={formData.title}
                      onChange={handleChange('title')}
                      error={!!errors.title}
                      helperText={errors.title}
                      placeholder={t('common:enterTitle')}
                      inputProps={{ maxLength: 100 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      multiline
                      rows={4}
                      label={t('description')}
                      value={formData.description}
                      onChange={handleChange('description')}
                      error={!!errors.description}
                      helperText={errors.description || `${formData.description.length}/500 ${t('common:characters')}`}
                      placeholder={t('enterDescription')}
                      inputProps={{ maxLength: 500 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Priority Level Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AlertTriangle size={20} color={getPriorityColor(formData.priority)} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('priorities.title')}
                  </Typography>
                </Box>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <Grid item xs={6} sm={3} key={priority}>
                      <Button
                        fullWidth
                        variant={formData.priority === priority ? 'contained' : 'outlined'}
                        color={getPriorityColor(priority)}
                        onClick={() => setFormData({ ...formData, priority: priority as any })}
                        sx={{ py: 1.5 }}
                      >
                        {t(`priorities.${priority}`)}
                      </Button>
                    </Grid>
                  ))}
                </Grid>

                <Alert severity="info" sx={{ mt: 2 }}>
                  {getPriorityDescription(formData.priority)}
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Property Selection Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Building size={20} color="#1976d2" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('selectProperty')}
                  </Typography>
                </Box>

                <Box
                  onClick={() => setShowPropertyModal(true)}
                  sx={{
                    border: 1,
                    borderColor: errors.property_id ? 'error.main' : 'divider',
                    borderRadius: 1,
                    p: 2,
                    cursor: 'pointer',
                    minHeight: 80,
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  {selectedProperty ? (
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {selectedProperty.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {selectedProperty.address}
                      </Typography>
                      {selectedProperty.property_code && (
                        <Chip label={selectedProperty.property_code} size="small" />
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ width: '100%', textAlign: 'center' }}>
                      <Building size={24} color="#9e9e9e" />
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        {t('tapToSelect')}
                      </Typography>
                    </Box>
                  )}
                </Box>
                {errors.property_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.property_id}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Photo Attachment Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Camera size={20} color="#1976d2" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('photos.title')}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('photos.description')}
                </Typography>

                {formData.images.length > 0 && (
                  <ImageList cols={3} gap={8} sx={{ mb: 2 }}>
                    {formData.images.map((image, index) => (
                      <ImageListItem key={index}>
                        <img
                          src={image}
                          alt={`Upload ${index + 1}`}
                          loading="lazy"
                          style={{ height: 150, objectFit: 'cover' }}
                        />
                        <ImageListItemBar
                          actionIcon={
                            <IconButton
                              sx={{ color: 'white' }}
                              onClick={() => removeImage(index)}
                            >
                              <X size={20} />
                            </IconButton>
                          }
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                )}

                {formData.images.length < 5 && (
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<Upload size={20} />}
                    fullWidth
                  >
                    {t('photos.upload')} ({formData.images.length}/5)
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard/maintenance')}
                disabled={loading}
              >
                {t('common:cancel')}
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
              >
                {loading ? t('common:submitting') : t('submitRequest')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Property Selection Dialog */}
      <Dialog
        open={showPropertyModal}
        onClose={() => setShowPropertyModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {t('selectProperty')}
            <IconButton onClick={() => setShowPropertyModal(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {propertiesLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                {t('common:loading')}...
              </Typography>
            </Box>
          ) : propertiesError ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {propertiesError}
              </Alert>
              <Button variant="outlined" onClick={() => window.location.reload()}>
                {t('common:retry')}
              </Button>
            </Box>
          ) : properties.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Building size={48} color="#9e9e9e" />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                {t('noPropertiesAvailable')}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {properties.map((property) => (
                <Grid item xs={12} key={property.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handlePropertySelect(property)}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {property.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {property.address}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {property.status && <Chip label={property.status} size="small" />}
                        {property.property_code && <Chip label={property.property_code} size="small" />}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
