import { create } from 'zustand';
import { Comparison, ComparisonItem, UserPreferences, CategoryWeight } from '@/types/comparison';
import { generateId } from './utils';
import { saveToHistory, saveCurrentComparison, loadCurrentComparison, loadDisplayPreferences, saveDisplayPreferences } from './storage';

interface ComparisonStore {
  comparison: Comparison | null;
  apiKey: string;
  setComparison: (comparison: Comparison) => void;
  setApiKey: (apiKey: string) => void;
  updateUserPreferences: (preferences: UserPreferences) => void;
  updateCategoryWeight: (category: string, importance: number) => void;
  addItem: (item: ComparisonItem) => void;
  removeItem: (itemId: string) => void;
  updatePoint: (itemId: string, pointId: string, updates: { text?: string; weight?: number }) => void;
  updateTitle: (title: string) => void;
  reset: () => void;
}

const createDefaultPreferences = (categories: string[]): UserPreferences => {
  const savedPrefs = loadDisplayPreferences();
  return {
    id: generateId(),
    name: 'Balanced',
    categoryWeights: categories.map(cat => ({
      category: cat,
      importance: 5,
      visible: true
    })),
    viewMode: 'standard',
    scoreDisplay: 'numeric',
    showScores: savedPrefs.showScores,
    sortByScore: false,
    hideCategories: [],
    colorScheme: 'default',
    hideWinner: savedPrefs.hideWinner
  };
};

export const useComparisonStore = create<ComparisonStore>((set) => ({
  comparison: loadCurrentComparison(),
  apiKey: '',

  setComparison: (comparison) => {
    saveToHistory(comparison);
    saveCurrentComparison(comparison);
    set({ comparison });
  },

  setApiKey: (apiKey) => set({ apiKey }),

  updateUserPreferences: (preferences) => set((state) => {
    if (!state.comparison) return state;
    const updatedComparison = {
      ...state.comparison,
      userPreferences: preferences
    };
    saveToHistory(updatedComparison);
    saveCurrentComparison(updatedComparison);
    return {
      comparison: updatedComparison
    };
  }),

  updateCategoryWeight: (category, importance) => set((state) => {
    if (!state.comparison?.userPreferences) return state;

    const updatedWeights = state.comparison.userPreferences.categoryWeights.map(cw =>
      cw.category === category ? { ...cw, importance } : cw
    );

    const updatedComparison = {
      ...state.comparison,
      userPreferences: {
        ...state.comparison.userPreferences,
        categoryWeights: updatedWeights
      }
    };

    saveToHistory(updatedComparison);
    saveCurrentComparison(updatedComparison);

    return {
      comparison: updatedComparison
    };
  }),

  addItem: (item) => set((state) => {
    if (!state.comparison) return state;
    const updatedComparison = {
      ...state.comparison,
      items: [...state.comparison.items, item]
    };
    saveCurrentComparison(updatedComparison);
    return {
      comparison: updatedComparison
    };
  }),

  removeItem: (itemId) => set((state) => {
    if (!state.comparison) return state;
    const updatedComparison = {
      ...state.comparison,
      items: state.comparison.items.filter(item => item.id !== itemId)
    };
    saveCurrentComparison(updatedComparison);
    return {
      comparison: updatedComparison
    };
  }),

  updatePoint: (itemId, pointId, updates) => set((state) => {
    if (!state.comparison) return state;

    const updatedItems = state.comparison.items.map(item => {
      if (item.id !== itemId) return item;

      return {
        ...item,
        points: item.points.map(point => {
          if (point.id !== pointId) return point;
          return {
            ...point,
            ...(updates.text !== undefined && { text: updates.text }),
            ...(updates.weight !== undefined && { weight: updates.weight })
          };
        })
      };
    });

    const updatedComparison = {
      ...state.comparison,
      items: updatedItems
    };

    saveCurrentComparison(updatedComparison);

    return {
      comparison: updatedComparison
    };
  }),

  updateTitle: (title) => set((state) => {
    if (!state.comparison) return state;

    const updatedComparison = {
      ...state.comparison,
      title
    };

    saveCurrentComparison(updatedComparison);

    return {
      comparison: updatedComparison
    };
  }),

  reset: () => {
    saveCurrentComparison(null);
    set({ comparison: null });
  }
}));

export { createDefaultPreferences };
