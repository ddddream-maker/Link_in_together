export type Difficulty = 'easy' | 'normal' | 'hard';

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  WON = 'WON',
  LOST = 'LOST'
}

export interface Position {
  x: number;
  y: number;
}

export interface TileData {
  id: string; // Unique ID for React keys
  type: string; // Fruit type (Emoji char)
  x: number;
  y: number;
  isEmpty: boolean;
  isBlocker?: boolean; // If true, this is a permanent wall/gap in the pattern
}

export interface BoardConfig {
  rows: number;
  cols: number;
  totalTime: number; // in seconds
  initialHints: number;
  initialShuffles: number;
}

export interface PathNode {
  x: number;
  y: number;
  turns: number;
  direction: 'none' | 'up' | 'down' | 'left' | 'right';
  parent?: PathNode;
}

export interface GameRecord {
  score: number;
  timeUsed: number; // in seconds
}

export interface User {
  username: string;
  // Map difficulty to their best record
  records: {
    easy?: GameRecord;
    normal?: GameRecord;
    hard?: GameRecord;
  };
}