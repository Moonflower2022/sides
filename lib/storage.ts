import { Comparison, UserPreferences } from '@/types/comparison';

const HISTORY_KEY = 'decision-maker-history';
const CURRENT_KEY = 'decision-maker-current';
const MAX_HISTORY_ITEMS = 20;

export interface ComparisonHistoryItem {
  comparison: Comparison;
  timestamp: number;
}

export interface PreferenceHistory {
  comparisons: ComparisonHistoryItem[];
}

/**
 * Load comparison history from local storage
 */
export function loadHistory(): PreferenceHistory {
  if (typeof window === 'undefined') {
    return { comparisons: [] };
  }

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) {
      return { comparisons: [] };
    }

    const parsed = JSON.parse(stored);

    // Convert date strings back to Date objects
    const comparisons = parsed.comparisons.map((item: any) => ({
      ...item,
      comparison: {
        ...item.comparison,
        createdAt: new Date(item.comparison.createdAt),
        updatedAt: new Date(item.comparison.updatedAt)
      }
    }));

    return { comparisons };
  } catch (error) {
    console.error('Failed to load history:', error);
    return { comparisons: [] };
  }
}

/**
 * Save a comparison to history
 */
export function saveToHistory(comparison: Comparison): void {
  if (typeof window === 'undefined') return;

  try {
    const history = loadHistory();

    // Check if this comparison already exists (by ID)
    const existingIndex = history.comparisons.findIndex(
      item => item.comparison.id === comparison.id
    );

    if (existingIndex >= 0) {
      // Update existing
      history.comparisons[existingIndex] = {
        comparison,
        timestamp: Date.now()
      };
    } else {
      // Add new
      history.comparisons.unshift({
        comparison,
        timestamp: Date.now()
      });

      // Keep only the most recent MAX_HISTORY_ITEMS
      if (history.comparisons.length > MAX_HISTORY_ITEMS) {
        history.comparisons = history.comparisons.slice(0, MAX_HISTORY_ITEMS);
      }
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

/**
 * Extract preference patterns from history
 * Returns a summary of category weights across all historical comparisons
 */
export function extractPreferencePatterns(history: PreferenceHistory): Record<string, number[]> {
  const categoryWeights: Record<string, number[]> = {};

  history.comparisons.forEach(({ comparison }) => {
    if (!comparison.userPreferences) return;

    comparison.userPreferences.categoryWeights.forEach(cw => {
      const key = cw.category.toLowerCase();
      if (!categoryWeights[key]) {
        categoryWeights[key] = [];
      }
      categoryWeights[key].push(cw.importance);
    });
  });

  return categoryWeights;
}

/**
 * Get average preferences from history
 */
export function getAveragePreferences(history: PreferenceHistory): Record<string, number> {
  const patterns = extractPreferencePatterns(history);
  const averages: Record<string, number> = {};

  Object.entries(patterns).forEach(([category, weights]) => {
    const avg = weights.reduce((sum, w) => sum + w, 0) / weights.length;
    averages[category] = Math.round(avg);
  });

  return averages;
}

/**
 * Check if user has sufficient history for personalized recommendations
 */
export function hasEnoughHistory(history: PreferenceHistory): boolean {
  return history.comparisons.length >= 2;
}

/**
 * Save the current comparison to localStorage
 */
export function saveCurrentComparison(comparison: Comparison | null): void {
  if (typeof window === 'undefined') return;

  try {
    if (comparison === null) {
      localStorage.removeItem(CURRENT_KEY);
    } else {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(comparison));
    }
  } catch (error) {
    console.error('Failed to save current comparison:', error);
  }
}

/**
 * Load the current comparison from localStorage
 */
export function loadCurrentComparison(): Comparison | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CURRENT_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Convert date strings back to Date objects
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt)
    };
  } catch (error) {
    console.error('Failed to load current comparison:', error);
    return null;
  }
}
