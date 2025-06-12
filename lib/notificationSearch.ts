/**
 * Advanced Notification Search Engine
 * 
 * Provides comprehensive search capabilities including full-text search,
 * fuzzy matching, autocomplete, search history, and analytics.
 */

import { NotificationWithProfile } from '@/types/notification';
import { NotificationCategory, notificationCategoryService } from './notificationCategories';

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: string;
  value: string;
  indices: [number, number][];
}

export interface SearchQuery {
  text: string;
  categories?: NotificationCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  fields?: SearchField[];
}

export interface SearchField {
  name: 'title' | 'message' | 'type' | 'category';
  weight: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'category' | 'keyword' | 'recent' | 'popular';
  count?: number;
}

export interface SearchHistory {
  query: string;
  timestamp: Date;
  resultCount: number;
}

export interface SearchAnalytics {
  totalSearches: number;
  popularQueries: Array<{ query: string; count: number }>;
  averageResultCount: number;
  searchTrends: Array<{ date: string; count: number }>;
}

/**
 * Default search fields with weights
 */
export const DEFAULT_SEARCH_FIELDS: SearchField[] = [
  { name: 'title', weight: 1.0 },
  { name: 'message', weight: 0.8 },
  { name: 'type', weight: 0.6 },
  { name: 'category', weight: 0.4 }
];

/**
 * Advanced Notification Search Engine
 */
export class NotificationSearchEngine {
  private static instance: NotificationSearchEngine;
  private searchHistory: SearchHistory[] = [];
  private indexedNotifications: Map<string, NotificationWithProfile> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map();
  private analytics: SearchAnalytics;

  private constructor() {
    this.analytics = {
      totalSearches: 0,
      popularQueries: [],
      averageResultCount: 0,
      searchTrends: []
    };
  }

  public static getInstance(): NotificationSearchEngine {
    if (!NotificationSearchEngine.instance) {
      NotificationSearchEngine.instance = new NotificationSearchEngine();
    }
    return NotificationSearchEngine.instance;
  }

  /**
   * Index notifications for fast searching
   */
  indexNotifications(notifications: NotificationWithProfile[]): void {
    this.indexedNotifications.clear();
    this.searchIndex.clear();

    notifications.forEach(notification => {
      const id = notification.id;
      this.indexedNotifications.set(id, notification);

      // Index searchable fields
      const searchableText = this.extractSearchableText(notification);
      const tokens = this.tokenize(searchableText);

      tokens.forEach(token => {
        if (!this.searchIndex.has(token)) {
          this.searchIndex.set(token, new Set());
        }
        this.searchIndex.get(token)!.add(id);
      });
    });
  }

  /**
   * Extract searchable text from notification
   */
  private extractSearchableText(notification: NotificationWithProfile): string {
    return [
      notification.title,
      notification.message,
      notification.type,
      notification.category,
      ...(notification.tags || [])
    ].join(' ').toLowerCase();
  }

  /**
   * Tokenize text for indexing
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  /**
   * Perform full-text search
   */
  search(query: SearchQuery): SearchResult<NotificationWithProfile>[] {
    if (!query.text.trim()) {
      return [];
    }

    // Record search in history and analytics
    this.recordSearch(query.text);

    const searchTokens = this.tokenize(query.text);
    const candidateIds = this.findCandidates(searchTokens);
    const results: SearchResult<NotificationWithProfile>[] = [];

    candidateIds.forEach(id => {
      const notification = this.indexedNotifications.get(id);
      if (!notification) return;

      // Apply category filter if specified
      if (query.categories && !query.categories.includes(notification.category)) {
        return;
      }

      // Apply date range filter if specified
      if (query.dateRange) {
        const notificationDate = new Date(notification.timestamp);
        if (notificationDate < query.dateRange.start || notificationDate > query.dateRange.end) {
          return;
        }
      }

      const score = this.calculateRelevanceScore(notification, query);
      const matches = this.findMatches(notification, query.text);

      if (score > 0) {
        results.push({
          item: notification,
          score,
          matches
        });
      }
    });

    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Find candidate notification IDs based on search tokens
   */
  private findCandidates(searchTokens: string[]): Set<string> {
    if (searchTokens.length === 0) {
      return new Set();
    }

    // Start with notifications matching the first token
    let candidates = this.searchIndex.get(searchTokens[0]) || new Set();

    // Intersect with notifications matching other tokens
    for (let i = 1; i < searchTokens.length; i++) {
      const tokenMatches = this.searchIndex.get(searchTokens[i]) || new Set();
      candidates = new Set([...candidates].filter(id => tokenMatches.has(id)));
    }

    // Also include partial matches for fuzzy search
    searchTokens.forEach(token => {
      this.searchIndex.forEach((ids, indexToken) => {
        if (this.fuzzyMatch(indexToken, token)) {
          ids.forEach(id => candidates.add(id));
        }
      });
    });

    return candidates;
  }

  /**
   * Calculate relevance score for a notification
   */
  private calculateRelevanceScore(notification: NotificationWithProfile, query: SearchQuery): number {
    const fields = query.fields || DEFAULT_SEARCH_FIELDS;
    let totalScore = 0;

    fields.forEach(field => {
      const fieldValue = this.getFieldValue(notification, field.name);
      const fieldScore = this.calculateFieldScore(fieldValue, query.text);
      totalScore += fieldScore * field.weight;
    });

    // Boost score for exact matches
    const exactMatchBoost = this.calculateExactMatchBoost(notification, query.text);
    totalScore += exactMatchBoost;

    // Boost score for recent notifications
    const recencyBoost = this.calculateRecencyBoost(notification);
    totalScore += recencyBoost;

    // Boost score for high priority notifications
    const priorityBoost = this.calculatePriorityBoost(notification);
    totalScore += priorityBoost;

    return Math.round(totalScore * 100) / 100;
  }

  /**
   * Get field value from notification
   */
  private getFieldValue(notification: NotificationWithProfile, fieldName: string): string {
    switch (fieldName) {
      case 'title':
        return notification.title;
      case 'message':
        return notification.message;
      case 'type':
        return notification.type;
      case 'category':
        return notification.category;
      default:
        return '';
    }
  }

  /**
   * Calculate score for a specific field
   */
  private calculateFieldScore(fieldValue: string, searchText: string): number {
    const fieldLower = fieldValue.toLowerCase();
    const searchLower = searchText.toLowerCase();

    // Exact match
    if (fieldLower === searchLower) {
      return 1.0;
    }

    // Contains exact phrase
    if (fieldLower.includes(searchLower)) {
      return 0.8;
    }

    // Contains all words
    const searchWords = searchLower.split(/\s+/);
    const containsAll = searchWords.every(word => fieldLower.includes(word));
    if (containsAll) {
      return 0.6;
    }

    // Contains some words
    const containsCount = searchWords.filter(word => fieldLower.includes(word)).length;
    if (containsCount > 0) {
      return 0.4 * (containsCount / searchWords.length);
    }

    return 0;
  }

  /**
   * Calculate exact match boost
   */
  private calculateExactMatchBoost(notification: NotificationWithProfile, searchText: string): number {
    const searchLower = searchText.toLowerCase();
    
    if (notification.title.toLowerCase() === searchLower) {
      return 0.5;
    }
    
    if (notification.message.toLowerCase().includes(searchLower)) {
      return 0.3;
    }
    
    return 0;
  }

  /**
   * Calculate recency boost
   */
  private calculateRecencyBoost(notification: NotificationWithProfile): number {
    const now = new Date();
    const notificationDate = new Date(notification.timestamp);
    const ageInDays = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageInDays < 1) return 0.2;
    if (ageInDays < 7) return 0.1;
    if (ageInDays < 30) return 0.05;
    
    return 0;
  }

  /**
   * Calculate priority boost
   */
  private calculatePriorityBoost(notification: NotificationWithProfile): number {
    const priorityBoosts = {
      urgent: 0.3,
      high: 0.2,
      medium: 0.1,
      low: 0
    };
    
    return priorityBoosts[notification.priority] || 0;
  }

  /**
   * Find text matches in notification
   */
  private findMatches(notification: NotificationWithProfile, searchText: string): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const searchLower = searchText.toLowerCase();

    DEFAULT_SEARCH_FIELDS.forEach(field => {
      const fieldValue = this.getFieldValue(notification, field.name);
      const fieldLower = fieldValue.toLowerCase();
      
      const index = fieldLower.indexOf(searchLower);
      if (index >= 0) {
        matches.push({
          field: field.name,
          value: fieldValue,
          indices: [[index, index + searchText.length]]
        });
      }
    });

    return matches;
  }

  /**
   * Fuzzy matching for partial word matches
   */
  private fuzzyMatch(indexToken: string, searchToken: string): boolean {
    if (searchToken.length < 3) return false;
    
    // Simple edit distance threshold
    const threshold = Math.max(1, Math.floor(searchToken.length * 0.2));
    return this.editDistance(indexToken, searchToken) <= threshold;
  }

  /**
   * Calculate edit distance between two strings
   */
  private editDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get search suggestions
   */
  getSuggestions(partialQuery: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = partialQuery.toLowerCase();

    // Category suggestions
    if (queryLower.length > 0) {
      notificationCategoryService.getAllCategories().forEach(category => {
        if (category.name.toLowerCase().includes(queryLower)) {
          suggestions.push({
            text: category.name,
            type: 'category'
          });
        }
      });
    }

    // Recent search suggestions
    this.searchHistory
      .filter(h => h.query.toLowerCase().includes(queryLower))
      .slice(0, 5)
      .forEach(history => {
        suggestions.push({
          text: history.query,
          type: 'recent',
          count: history.resultCount
        });
      });

    // Popular query suggestions
    this.analytics.popularQueries
      .filter(q => q.query.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .forEach(popular => {
        suggestions.push({
          text: popular.query,
          type: 'popular',
          count: popular.count
        });
      });

    return suggestions.slice(0, 10);
  }

  /**
   * Record search in history
   */
  private recordSearch(query: string): void {
    this.searchHistory.unshift({
      query,
      timestamp: new Date(),
      resultCount: 0 // Will be updated after search
    });

    // Keep only recent 50 searches
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(0, 50);
    }

    // Update analytics
    this.updateAnalytics(query);
  }

  /**
   * Update search analytics
   */
  private updateAnalytics(query: string): void {
    this.analytics.totalSearches++;

    // Update popular queries
    const existingQuery = this.analytics.popularQueries.find(q => q.query === query);
    if (existingQuery) {
      existingQuery.count++;
    } else {
      this.analytics.popularQueries.push({ query, count: 1 });
    }

    // Sort and limit popular queries
    this.analytics.popularQueries.sort((a, b) => b.count - a.count);
    this.analytics.popularQueries = this.analytics.popularQueries.slice(0, 20);
  }

  /**
   * Get search history
   */
  getSearchHistory(limit: number = 10): SearchHistory[] {
    return this.searchHistory.slice(0, limit);
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Get search analytics
   */
  getAnalytics(): SearchAnalytics {
    return { ...this.analytics };
  }

  /**
   * Clear search index
   */
  clearIndex(): void {
    this.indexedNotifications.clear();
    this.searchIndex.clear();
  }
}

/**
 * Search engine singleton instance
 */
export const notificationSearchEngine = NotificationSearchEngine.getInstance(); 