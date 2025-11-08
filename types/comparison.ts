export type Polarity = 'pro' | 'con' | 'neutral';
export type ViewMode = 'standard' | 'focused' | 'priorities' | 'heatmap';
export type ScoreDisplayType = 'numeric' | 'stars' | 'grade' | 'rank';

export interface ComparisonPoint {
  id: string;
  text: string;
  type: Polarity;
  weight: number; // 1-10 (importance of this specific point)
  category: string;
  color?: string; // Optional custom color override
  isDealBreaker?: boolean;
  isMustHave?: boolean;
}

export interface ComparisonItem {
  id: string;
  name: string;
  points: ComparisonPoint[];
  description?: string;
  metadata?: Record<string, any>;
}

export interface CategoryWeight {
  category: string;
  importance: number; // 0-10
  visible: boolean;
  color?: string;
}

export interface UserPreferences {
  id: string;
  name: string;
  categoryWeights: CategoryWeight[];
  viewMode: ViewMode;
  scoreDisplay: ScoreDisplayType;
  showScores: boolean;
  sortByScore: boolean;
  hideCategories: string[];
  colorScheme: 'default' | 'colorblind' | 'high-contrast' | 'custom';
  hideWinner?: boolean;
}

export interface ItemScore {
  itemId: string;
  totalScore: number;
  rank: number;
  categoryBreakdown: {
    category: string;
    contribution: number;
    points: ComparisonPoint[];
  }[];
}

export interface Comparison {
  id: string;
  title?: string;
  items: ComparisonItem[];
  categories: string[];
  userPreferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParsedInput {
  title?: string;
  items: ComparisonItem[];
  categories: string[];
}
