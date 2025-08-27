import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, RefreshControl, Alert } from 'react-native';
import { Text, Searchbar, SegmentedButtons, IconButton, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { documentsApi } from '@/lib/api';
import { 
  FileText, 
  Image as ImageIcon, 
  File, 
  Download, 
  Eye, 
  Share,
  Calendar,
  User,
  Building2,
  Upload,
  Plus
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';
import { useTranslation } from '@/lib/useTranslation';

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'invoice' | 'receipt' | 'image' | 'report' | 'other';
  size: string;
  uploadDate: string;
  uploadedBy: string;
  property?: string;
  tenant?: string;
  url: string;
  thumbnail?: string;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { t } = useTranslation('documents');
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    totalDocuments: 156,
    thisMonth: 23,
    totalSize: '2.4 GB',
    avgSize: '15.6 MB',
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, activeFilter]);

  const fetchDocuments = async () => {
    try {
      const response = await documentsApi.getAll();
      if (response.data) {
        // Transform documents to match expected format
        const transformedDocs: Document[] = response.data.map(doc => ({
          id: doc.id,
          name: doc.title,
          type: doc.document_type as any,
          size: doc.file_size ? formatFileSize(doc.file_size) : 'Unknown',
          uploadDate: doc.created_at,
          uploadedBy: 'User', // would need to join with profiles table for real name
          property: doc.related_entity_type === 'property' ? 'Property' : undefined,
          tenant: doc.related_entity_type === 'tenant' ? 'Tenant' : undefined,
          url: doc.file_path,
        }));
        setDocuments(transformedDocs);
        console.log('Loaded documents:', transformedDocs.length);
      } else if (response.error) {
        console.error('API Error:', response.error);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const filterDocuments = () => {
    let filtered = [...documents];
    
    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.type === activeFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(query) ||
        doc.uploadedBy.toLowerCase().includes(query) ||
        doc.property?.toLowerCase().includes(query) ||
        doc.tenant?.toLowerCase().includes(query)
      );
    }
    
    setFilteredDocuments(filtered);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <FileText size={20} color={theme.colors.primary} />;
      case 'invoice':
        return <File size={20} color={theme.colors.success} />;
      case 'receipt':
        return <File size={20} color={theme.colors.secondary} />;
      case 'image':
        return <ImageIcon size={20} color={theme.colors.warning} />;
      case 'report':
        return <FileText size={20} color={theme.colors.tertiary} />;
      default:
        return <File size={20} color={theme.colors.onSurfaceVariant} />;
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
        return theme.colors.warning;
      case 'report':
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <ModernCard style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <View style={styles.documentTitleRow}>
            <View style={[styles.typeIcon, { backgroundColor: `${getTypeColor(item.type)}15` }]}>
              {getTypeIcon(item.type)}
            </View>
            <View style={styles.documentDetails}>
              <Text style={styles.documentName} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.documentSize}>{item.size}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.uploadDate}>
                  {new Date(item.uploadDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          
          {item.thumbnail && (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumbnail}
            />
          )}
        </View>
      </View>
      
      <View style={styles.documentMeta}>
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <User size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{item.uploadedBy}</Text>
          </View>
          {item.property && (
            <View style={styles.metaItem}>
              <Building2 size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.metaText}>{item.property}</Text>
            </View>
          )}
        </View>
        
        <Chip
          mode="outlined"
          style={[styles.typeChip, { borderColor: getTypeColor(item.type) }]}
          textStyle={[styles.typeText, { color: getTypeColor(item.type) }]}
        >
          {t(`documentTypes.${item.type}`) || item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Chip>
      </View>
      
      <View style={styles.documentActions}>
        <IconButton
          icon={() => <Eye size={20} color={theme.colors.primary} />}
          onPress={() => {
            console.log('Navigating to document:', item.id);
            router.push(`/documents/${item.id}`);
          }}
          style={styles.actionButton}
        />
        <IconButton
          icon={() => <Download size={20} color={theme.colors.secondary} />}
          onPress={() => console.log('Download document', item.id)}
          style={styles.actionButton}
        />
        <IconButton
          icon={() => <Share size={20} color={theme.colors.tertiary} />}
          onPress={() => console.log('Share document', item.id)}
          style={styles.actionButton}
        />
      </View>
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('title')}
        subtitle={t('subtitle')}
        variant="dark"
        showNotifications={true}
      />

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              title: t('totalDocuments'),
              value: stats.totalDocuments.toString(),
              color: theme.colors.primary,
              icon: <FileText size={20} color={theme.colors.primary} />,
            },
            {
              title: t('thisMonth'),
              value: stats.thisMonth.toString(),
              subtitle: t('uploaded'),
              color: theme.colors.success,
              icon: <Upload size={20} color={theme.colors.success} />,
              trend: { value: '+15%', isPositive: true },
            },
            {
              title: t('totalSize'),
              value: stats.totalSize,
              color: theme.colors.secondary,
              icon: <File size={20} color={theme.colors.secondary} />,
            },
            {
              title: t('avgSize'),
              value: stats.avgSize,
              subtitle: t('perDocument'),
              color: theme.colors.warning,
              icon: <FileText size={20} color={theme.colors.warning} />,
            },
          ]}
          renderItem={({ item }) => (
            <StatCard
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              color={item.color}
              icon={item.icon}
              trend={item.trend}
            />
          )}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.statsContainer}
        />
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersSection}>
        <Searchbar
          placeholder={t('searchPlaceholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.onSurfaceVariant}
        />
        
        <SegmentedButtons
          value={activeFilter}
          onValueChange={setActiveFilter}
          buttons={[
            { value: 'all', label: t('common:all') },
            { value: 'contract', label: t('documentTypes.contract') },
            { value: 'invoice', label: t('documentTypes.invoice') },
            { value: 'image', label: t('documentTypes.photo') },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Documents List */}
      <FlatList
        data={filteredDocuments}
        renderItem={renderDocument}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ModernCard style={styles.emptyState}>
            <FileText size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateTitle}>{t('noDocumentsFound')}</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || activeFilter !== 'all' 
                ? t('adjustSearchOrFilters') 
                : t('uploadFirstDocument')}
            </Text>
          </ModernCard>
        }
      />

      {/* Upload Document FAB */}
      <View style={styles.fabContainer}>
        <ModernCard style={styles.fab}>
          <Text
            style={styles.fabText}
            onPress={() => router.push('/documents/upload')}
          >
            <Plus size={24} color="white" />
          </Text>
        </ModernCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsSection: {
    marginBottom: spacing.m,
  },
  statsContainer: {
    paddingHorizontal: spacing.m,
  },
  filtersSection: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  searchbar: {
    marginBottom: spacing.m,
    backgroundColor: theme.colors.surface,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxxl,
  },
  documentCard: {
    marginBottom: spacing.m,
  },
  documentHeader: {
    marginBottom: spacing.m,
  },
  documentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  documentTitleRow: {
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.m,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentSize: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  separator: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginHorizontal: 6,
  },
  uploadDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  metaInfo: {
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 6,
  },
  typeChip: {
    height: 28,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: spacing.s,
  },
  actionButton: {
    margin: 0,
    marginLeft: spacing.s,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
});