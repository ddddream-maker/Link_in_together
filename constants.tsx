import { Difficulty, BoardConfig } from './types';

export const DIFFICULTY_CONFIG: Record<Difficulty, BoardConfig> = {
  easy: {
    rows: 8,
    cols: 10, 
    totalTime: 90, // Reduced from 180
    initialHints: 5,
    initialShuffles: 3
  },
  normal: {
    rows: 10,
    cols: 14,
    totalTime: 150, // Reduced from 300
    initialHints: 3,
    initialShuffles: 2
  },
  hard: {
    rows: 12,
    cols: 18,
    totalTime: 210, // Reduced from 420
    initialHints: 2,
    initialShuffles: 1
  }
};

export const COMBO_CONFIG = {
  WINDOW_MS: 3000, // 3 seconds to chain combo
  BASE_TIME_BONUS: 2, // Seconds added per normal match
  COMBO_TIME_BONUS: 1, // Extra seconds per combo level
  COMBO_SCORE_BONUS: 50 // Extra points per combo level
};

// Expanded list of Emojis for variety
export const FRUIT_EMOJIS = [
  '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
  '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
  '🥬', '🥒', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯',
  '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓',
  '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆',
  '🌮', '🌯', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮',
  '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂',
  '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯'
];

export const MATCH_SCORE = 100;
export const BOARD_PADDING = 1; // Invisible padding around the grid for pathfinding