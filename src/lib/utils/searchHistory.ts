/**
 * Search History Utility
 * 
 * Manages recent searches in localStorage
 */

const SEARCH_HISTORY_KEY = 'noticebazaar_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

/**
 * Get search history for a user
 */
export function getSearchHistory(userId?: string): SearchHistoryItem[] {
  try {
    const key = userId ? `${SEARCH_HISTORY_KEY}_${userId}` : SEARCH_HISTORY_KEY;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const history = JSON.parse(stored) as SearchHistoryItem[];
    return history.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  } catch (error) {
    console.error('Error reading search history:', error);
    return [];
  }
}

/**
 * Add a search query to history
 */
export function addToSearchHistory(query: string, userId?: string, resultCount?: number): void {
  if (!query.trim()) return;

  try {
    const key = userId ? `${SEARCH_HISTORY_KEY}_${userId}` : SEARCH_HISTORY_KEY;
    const history = getSearchHistory(userId);
    
    // Remove duplicate entries (case-insensitive)
    const filtered = history.filter(
      item => item.query.toLowerCase() !== query.toLowerCase()
    );
    
    // Add new entry at the beginning
    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
    };
    
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(userId?: string): void {
  try {
    const key = userId ? `${SEARCH_HISTORY_KEY}_${userId}` : SEARCH_HISTORY_KEY;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}

/**
 * Remove a specific search from history
 */
export function removeFromSearchHistory(query: string, userId?: string): void {
  try {
    const key = userId ? `${SEARCH_HISTORY_KEY}_${userId}` : SEARCH_HISTORY_KEY;
    const history = getSearchHistory(userId);
    const filtered = history.filter(
      item => item.query.toLowerCase() !== query.toLowerCase()
    );
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from search history:', error);
  }
}

