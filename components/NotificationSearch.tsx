import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity,
  Keyboard,
  Platform 
} from 'react-native';
import { 
  Text, 
  IconButton, 
  Chip, 
  Divider,
  Portal,
  Modal
} from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { 
  Search, 
  X, 
  History, 
  TrendingUp, 
  Hash, 
  Filter,
  ChevronDown,
  Clock
} from 'lucide-react-native';
import { 
  SearchSuggestion,
  SearchHistory,
  notificationSearchEngine
} from '@/lib/notificationSearch';
import { 
  NotificationCategory,
  CATEGORY_DEFINITIONS,
  notificationCategoryService
} from '@/lib/notificationCategories';

export interface NotificationSearchProps {
  value: string;
  onSearchChange: (query: string) => void;
  onCategoryFilter?: (categories: NotificationCategory[]) => void;
  placeholder?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
}

export const NotificationSearch: React.FC<NotificationSearchProps> = ({
  value,
  onSearchChange,
  onCategoryFilter,
  placeholder = 'Search notifications...',
  showFilters = true,
  autoFocus = false
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<NotificationCategory[]>([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    // Load search history when component mounts
    setSearchHistory(notificationSearchEngine.getSearchHistory());
  }, []);

  useEffect(() => {
    // Update suggestions based on current input
    if (value.trim().length > 0) {
      const newSuggestions = notificationSearchEngine.getSuggestions(value);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [value]);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setShowSuggestions(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    // Delay hiding suggestions to allow for tap events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    onSearchChange(suggestion.text);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleClearSearch = () => {
    onSearchChange('');
    searchInputRef.current?.focus();
  };

  const handleCategoryToggle = (category: NotificationCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newCategories);
    onCategoryFilter?.(newCategories);
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
    onCategoryFilter?.([]);
  };

  const handleClearHistory = () => {
    notificationSearchEngine.clearSearchHistory();
    setSearchHistory([]);
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'category':
        return Hash;
      case 'recent':
        return History;
      case 'popular':
        return TrendingUp;
      default:
        return Search;
    }
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'category':
        return theme.colors.primary;
      case 'recent':
        return theme.colors.onSurfaceVariant;
      case 'popular':
        return '#F59E0B';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const renderSuggestionItem = ({ item }: { item: SearchSuggestion }) => {
    const Icon = getSuggestionIcon(item.type);
    const iconColor = getSuggestionColor(item.type);

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
      >
        <Icon size={16} color={iconColor} />
        <Text style={[styles.suggestionText, { color: theme.colors.onSurface }]}>
          {item.text}
        </Text>
        <Text style={[styles.suggestionType, { color: theme.colors.onSurfaceVariant }]}>
          {item.type}
        </Text>
        {item.count && (
          <Text style={[styles.suggestionCount, { color: theme.colors.onSurfaceVariant }]}>
            ({item.count})
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = ({ item }: { item: SearchHistory }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleSuggestionPress({ text: item.query, type: 'recent' })}
    >
      <Clock size={14} color={theme.colors.onSurfaceVariant} />
      <Text style={[styles.historyText, { color: theme.colors.onSurface }]}>
        {item.query}
      </Text>
      <Text style={[styles.historyMeta, { color: theme.colors.onSurfaceVariant }]}>
        {item.resultCount} results • {new Date(item.timestamp).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoryFilters = () => (
    <View style={styles.categoryFilters}>
      <TouchableOpacity
        style={[styles.filterToggle, { borderColor: theme.colors.outline }]}
        onPress={() => setShowCategoryFilter(!showCategoryFilter)}
      >
        <Filter size={16} color={theme.colors.onSurfaceVariant} />
        <Text style={[styles.filterToggleText, { color: theme.colors.onSurface }]}>
          Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
        </Text>
        <ChevronDown 
          size={16} 
          color={theme.colors.onSurfaceVariant}
          style={[
            styles.filterToggleIcon,
            showCategoryFilter && styles.filterToggleIconRotated
          ]}
        />
      </TouchableOpacity>

      {showCategoryFilter && (
        <View style={styles.categoryChips}>
          <View style={styles.categoryChipContainer}>
            {Object.values(CATEGORY_DEFINITIONS).map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const Icon = category.icon;
              
              return (
                <Chip
                  key={category.id}
                  mode={isSelected ? 'flat' : 'outlined'}
                  selected={isSelected}
                  onPress={() => handleCategoryToggle(category.id)}
                  icon={() => <Icon size={12} color={isSelected ? '#fff' : category.color} />}
                  style={[
                    styles.categoryChip,
                    isSelected && { backgroundColor: category.color }
                  ]}
                  textStyle={[
                    styles.categoryChipText,
                    isSelected && { color: '#fff' }
                  ]}
                >
                  {category.name}
                </Chip>
              );
            })}
          </View>
          
          {selectedCategories.length > 0 && (
            <TouchableOpacity
              style={styles.clearCategoriesButton}
              onPress={handleClearCategories}
            >
              <Text style={[styles.clearCategoriesText, { color: theme.colors.primary }]}>
                Clear Categories
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderSuggestionsOverlay = () => {
    if (!showSuggestions) return null;

    const hasSuggestions = suggestions.length > 0;
    const hasHistory = searchHistory.length > 0 && value.trim().length === 0;

    if (!hasSuggestions && !hasHistory) return null;

    return (
      <Portal>
        <Modal
          visible={showSuggestions}
          onDismiss={() => setShowSuggestions(false)}
          contentContainerStyle={styles.suggestionsModal}
        >
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}>
            {hasSuggestions && (
              <View style={styles.suggestionsSection}>
                <Text style={[styles.suggestionsSectionTitle, { color: theme.colors.onSurface }]}>
                  Suggestions
                </Text>
                <FlatList
                  data={suggestions}
                  renderItem={renderSuggestionItem}
                  keyExtractor={(item, index) => `suggestion-${index}`}
                  showsVerticalScrollIndicator={false}
                  maxHeight={200}
                />
              </View>
            )}

            {hasHistory && (
              <View style={styles.historySection}>
                <View style={styles.historySectionHeader}>
                  <Text style={[styles.suggestionsSectionTitle, { color: theme.colors.onSurface }]}>
                    Recent Searches
                  </Text>
                  <TouchableOpacity onPress={handleClearHistory}>
                    <Text style={[styles.clearHistoryText, { color: theme.colors.primary }]}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={searchHistory}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item, index) => `history-${index}`}
                  showsVerticalScrollIndicator={false}
                  maxHeight={150}
                />
              </View>
            )}
          </View>
        </Modal>
      </Portal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchContainer,
        { 
          backgroundColor: theme.colors.surface,
          borderColor: isSearchFocused ? theme.colors.primary : theme.colors.outline
        }
      ]}>
        <Search size={20} color={theme.colors.onSurfaceVariant} />
        
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: theme.colors.onSurface }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={value}
          onChangeText={onSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          returnKeyType="search"
          clearButtonMode="never"
        />

        {value.length > 0 && (
          <IconButton
            icon={() => <X size={18} color={theme.colors.onSurfaceVariant} />}
            size={20}
            onPress={handleClearSearch}
            style={styles.clearButton}
          />
        )}
      </View>

      {showFilters && renderCategoryFilters()}
      {renderSuggestionsOverlay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: spacing.sm,
    ...Platform.select({
      ios: {
        height: 40,
      },
      android: {
        height: 48,
        paddingVertical: 0,
      },
    }),
  },
  clearButton: {
    margin: 0,
  },
  categoryFilters: {
    marginTop: spacing.sm,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    gap: spacing.sm,
  },
  filterToggleText: {
    flex: 1,
    fontSize: 14,
  },
  filterToggleIcon: {
    transform: [{ rotate: '0deg' }],
  },
  filterToggleIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  categoryChips: {
    marginTop: spacing.sm,
  },
  categoryChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    marginRight: 0,
    marginBottom: 0,
  },
  categoryChipText: {
    fontSize: 11,
  },
  clearCategoriesButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  clearCategoriesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionsModal: {
    margin: 0,
    justifyContent: 'flex-start',
    paddingTop: Platform.select({ ios: 100, android: 80 }),
  },
  suggestionsContainer: {
    margin: spacing.lg,
    borderRadius: 12,
    maxHeight: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  suggestionsSection: {
    padding: spacing.lg,
  },
  suggestionsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
  },
  suggestionType: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionCount: {
    fontSize: 11,
  },
  historySection: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  clearHistoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  historyText: {
    flex: 1,
    fontSize: 14,
  },
  historyMeta: {
    fontSize: 11,
  },
}); 