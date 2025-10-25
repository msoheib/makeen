import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { documentsApi } from '@/lib/api';
import { 
  FileText, 
  Image as ImageIcon, 
  File, 
  Download, 
  Share,
  ArrowLeft,
  Eye,
  Calendar,
  User,
  Building2,
  FileIcon,
  ExternalLink
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

interface DocumentDetails {
  id: string;
  title: string;
  document_type: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  uploaded_by: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export default function DocumentViewerScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      console.log('Fetching document with ID:', id);
      const response = await documentsApi.getById(id!);
      console.log('API Response:', response);
      
      if (response.data) {
        setDocument(response.data);
        console.log('Document loaded successfully:', response.data.title);
      } else {
        console.log('No document data in response');
        setError('Document not found');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <FileText size={24} color={theme.colors.primary} />;
      case 'invoice':
        return <File size={24} color={theme.colors.success} />;
      case 'receipt':
        return <File size={24} color={theme.colors.secondary} />;
      case 'image':
      case 'photo':
        return <ImageIcon size={24} color={theme.colors.warning} />;
      case 'legal':
      case 'insurance':
        return <FileText size={24} color={theme.colors.error} />;
      default:
        return <FileIcon size={24} color={theme.colors.onSurfaceVariant} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract':
        return theme.colors.primary;
      case 'invoice':
        return theme.colors.success;
      case 'receipt':
        return theme.colors.secondary;
      case 'image':
      case 'photo':
        return theme.colors.warning;
      case 'legal':
      case 'insurance':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const handleOpenDocument = async () => {
    if (!document?.file_path) {
      Alert.alert('Error', 'Document file path not available');
      return;
    }

    try {
      // Try to open the document with the system's default app
      const supported = await Linking.canOpenURL(document.file_path);
      
      if (supported) {
        await Linking.openURL(document.file_path);
      } else {
        Alert.alert(
          'Cannot Open Document',
          'This document type is not supported for viewing on this device. Please download it to view.'
        );
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const handleDownload = () => {
    if (!document?.file_path) {
      Alert.alert('Error', 'Document file path not available');
      return;
    }

    Alert.alert(
      'Download Document',
      'This feature will be implemented to download the document to your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => console.log('Download:', document.file_path) }
      ]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share Document',
      'This feature will be implemented to share the document with others.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => console.log('Share:', document?.id) }
      ]
    );
  };

  if (loading) {
      const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.m,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  errorSubtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    marginTop: spacing.m,
  },
  headerCard: {
    marginBottom: spacing.m,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  headerInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileSize: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  separator: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginHorizontal: 8,
  },
  uploadDate: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsCard: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  detailIcon: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  tagsSection: {
    marginTop: spacing.s,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.s,
  },
  tag: {
    marginRight: spacing.s,
    marginBottom: spacing.s,
  },
  actionsCard: {
    marginBottom: spacing.xl,
  },
  actionButton: {
    marginBottom: spacing.m,
  },
});

  return (
      <View style={styles.container}>
        <ModernHeader
          title="Document Viewer"
          subtitle="Loading document..."
          variant="dark"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      </View>
    );
  }

  if (error || !document) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title="Document Viewer"
          subtitle="Error loading document"
          variant="dark"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <File size={48} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.errorTitle}>Document Not Found</Text>
          <Text style={styles.errorSubtitle}>
            {error || 'The requested document could not be found.'}
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Document Viewer"
        subtitle={document.title}
        variant="dark"
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Document Header */}
        <ModernCard style={styles.headerCard}>
          <View style={styles.documentHeader}>
            <View style={[styles.typeIcon, { backgroundColor: `${getTypeColor(document.document_type)}15` }]}>
              {getTypeIcon(document.document_type)}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.documentTitle}>{document.title}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.fileSize}>{formatFileSize(document.file_size)}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.uploadDate}>
                  {new Date(document.created_at).toLocaleDateString('en-US')}
                </Text>
              </View>
            </View>
          </View>

          <Chip
            mode="outlined"
            style={[styles.typeChip, { borderColor: getTypeColor(document.document_type) }]}
            textStyle={[styles.typeText, { color: getTypeColor(document.document_type) }]}
          >
            {document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1)}
          </Chip>
        </ModernCard>

        {/* Document Details */}
        <ModernCard style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Document Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <FileIcon size={16} color={theme.colors.onSurfaceVariant} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>File Type</Text>
              <Text style={styles.detailValue}>
                {document.mime_type || 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={16} color={theme.colors.onSurfaceVariant} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Upload Date</Text>
              <Text style={styles.detailValue}>
                {new Date(document.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>

          {document.related_entity_type && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Building2 size={16} color={theme.colors.onSurfaceVariant} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Related To</Text>
                <Text style={styles.detailValue}>
                  {document.related_entity_type.charAt(0).toUpperCase() + document.related_entity_type.slice(1)}
                </Text>
              </View>
            </View>
          )}

          {document.tags && document.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.detailLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {document.tags.map((tag, index) => (
                  <Chip key={index} mode="outlined" style={styles.tag}>
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </ModernCard>

        {/* Action Buttons */}
        <ModernCard style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <Button
            mode="contained"
            onPress={handleOpenDocument}
            style={styles.actionButton}
            icon={() => <ExternalLink size={20} color={theme.colors.onPrimary} />}
          >
            Open Document
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleDownload}
            style={styles.actionButton}
            icon={() => <Download size={20} color={theme.colors.primary} />}
          >
            Download
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleShare}
            style={styles.actionButton}
            icon={() => <Share size={20} color={theme.colors.primary} />}
          >
            Share
          </Button>
        </ModernCard>
      </ScrollView>
    </View>
  );
}

 