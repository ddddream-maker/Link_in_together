import { TileData, Position, PathNode } from '../types';
import { FRUIT_EMOJIS, BOARD_PADDING } from '../constants';

// Helper to check bounds
const isValidPos = (x: number, y: number, rows: number, cols: number) => {
  return x >= 0 && x < cols && y >= 0 && y < rows;
};

// Pattern Generators
type PatternFn = (x: number, y: number, rows: number, cols: number) => boolean;

const patterns: Record<string, PatternFn> = {
  // Standard full rectangle
  'full': () => true,
  
  // The requested "Concave" (凹) shape
  'concave': (x, y, rows, cols) => {
    // Top middle is empty
    const middleStart = Math.floor(cols / 3);
    const middleEnd = Math.floor(cols * 2 / 3);
    const topDeep = Math.floor(rows / 2);
    
    if (y < topDeep && x >= middleStart && x < middleEnd) {
      return false; // Empty space
    }
    return true;
  },

  // A frame / hollow box
  'frame': (x, y, rows, cols) => {
    return x === 0 || x === cols - 1 || y === 0 || y === rows - 1 || 
           (x >= 2 && x <= cols - 3 && y >= 2 && y <= rows - 3);
  },

  // Diamond shape approximation
  'diamond': (x, y, rows, cols) => {
    const cx = cols / 2;
    const cy = rows / 2;
    const dx = Math.abs(x - cx + 0.5) / (cols / 2);
    const dy = Math.abs(y - cy + 0.5) / (rows / 2);
    return dx + dy <= 1.2; // 1.2 gives a slightly rounded/forgiving diamond
  },

  // Checkerboard gaps (only useful for very large grids)
  'checker': (x, y) => {
    return (x + y) % 2 === 0 || Math.random() > 0.3; // mostly filled
  },
  
  // Random noise holes
  'swiss_cheese': () => Math.random() > 0.15
};

const getRandomPattern = (): PatternFn => {
  const keys = Object.keys(patterns);
  // Give 'concave' and 'full' slightly higher weights logically, 
  // but here we just pick randomly.
  const key = keys[Math.floor(Math.random() * keys.length)];
  return patterns[key];
};

// Generate the initial board with patterns
export const generateBoard = (rows: number, cols: number): TileData[][] => {
  const totalRows = rows + (BOARD_PADDING * 2);
  const totalCols = cols + (BOARD_PADDING * 2);
  
  // 1. Determine active slots based on a random pattern
  const patternFn = getRandomPattern();
  const activeSlots: Position[] = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (patternFn(x, y, rows, cols)) {
        activeSlots.push({ x: x + BOARD_PADDING, y: y + BOARD_PADDING });
      }
    }
  }

  // 2. Ensure even number of tiles for pairs
  if (activeSlots.length % 2 !== 0) {
    // Remove a random slot to make it even
    const rmIdx = Math.floor(Math.random() * activeSlots.length);
    activeSlots.splice(rmIdx, 1);
  }

  // 3. Select Fruits
  const numPairs = activeSlots.length / 2;
  const gameFruits = FRUIT_EMOJIS.sort(() => Math.random() - 0.5).slice(0, Math.min(numPairs, 25)); // Use up to 25 distinct fruits
  
  let tileValues: string[] = [];
  for (let i = 0; i < numPairs; i++) {
    // Cycle through selected fruits if we need more pairs than types available
    const fruit = gameFruits[i % gameFruits.length];
    tileValues.push(fruit, fruit);
  }
  
  // Shuffle values
  tileValues = tileValues.sort(() => Math.random() - 0.5);

  // 4. Build Board
  const board: TileData[][] = [];
  
  // Initialize full padded grid as empty/blockers
  for (let y = 0; y < totalRows; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < totalCols; x++) {
      row.push({
        id: `pad-${x}-${y}`,
        type: '',
        x,
        y,
        isEmpty: true,
        isBlocker: true // Default to blocker, will open up valid slots below
      });
    }
    board.push(row);
  }

  // Place active tiles
  activeSlots.forEach((pos, idx) => {
    board[pos.y][pos.x] = {
      id: `tile-${pos.x}-${pos.y}-${Math.random().toString(36).substr(2, 5)}`,
      type: tileValues[idx],
      x: pos.x,
      y: pos.y,
      isEmpty: false,
      isBlocker: false
    };
  });

  // Also mark padding as non-blockers (traversable empty space)
  for (let y = 0; y < totalRows; y++) {
    for (let x = 0; x < totalCols; x++) {
       const isPadding = 
        y < BOARD_PADDING || 
        y >= totalRows - BOARD_PADDING || 
        x < BOARD_PADDING || 
        x >= totalCols - BOARD_PADDING;
        
       if (isPadding) {
         board[y][x].isBlocker = false;
       }
       
       // Also if a slot was inside the grid but NOT in activeSlots, it acts as empty traversable space
       // UNLESS we want "walls". For Connect-2, usually gaps are traversable.
       // The pattern simply dictates where tiles START. It doesn't build walls.
       // So ensure everything is non-blocker for pathfinding unless we specifically want walls.
       board[y][x].isBlocker = false; 
    }
  }

  return board;
};

// BFS Pathfinding
export const findPath = (
  start: Position,
  end: Position,
  board: TileData[][]
): Position[] | null => {
  const rows = board.length;
  const cols = board[0].length;

  const directions = [
    { x: 0, y: -1, name: 'up' },
    { x: 0, y: 1, name: 'down' },
    { x: -1, y: 0, name: 'left' },
    { x: 1, y: 0, name: 'right' }
  ] as const;

  const queue: PathNode[] = [
    { x: start.x, y: start.y, turns: 0, direction: 'none' }
  ];

  const visited = new Map<string, number>();

  while (queue.length > 0) {
    queue.sort((a, b) => a.turns - b.turns);
    const current = queue.shift()!;

    if (current.x === end.x && current.y === end.y) {
      const path: Position[] = [];
      let temp: PathNode | undefined = current;
      while (temp) {
        path.unshift({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path;
    }

    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;

      if (!isValidPos(nx, ny, rows, cols)) continue;

      const isTarget = nx === end.x && ny === end.y;
      const tile = board[ny][nx];
      
      // Can only traverse if empty or is target. 
      // isBlocker would be for walls, but currently we assume gaps are walkable.
      if (!tile.isEmpty && !isTarget) continue;

      const newTurns = (current.direction !== 'none' && current.direction !== dir.name)
        ? current.turns + 1
        : current.turns;

      if (newTurns > 2) continue;

      const visitKey = `${nx},${ny},${dir.name}`;
      if (visited.has(visitKey) && visited.get(visitKey)! <= newTurns) {
        continue;
      }
      visited.set(visitKey, newTurns);

      queue.push({
        x: nx,
        y: ny,
        turns: newTurns,
        direction: dir.name,
        parent: current
      });
    }
  }

  return null;
};

export const getHintPair = (board: TileData[][]): [Position, Position] | null => {
  const rows = board.length;
  const cols = board[0].length;
  const tiles: TileData[] = [];

  for(let y=0; y<rows; y++) {
    for(let x=0; x<cols; x++) {
      if(!board[y][x].isEmpty) {
        tiles.push(board[y][x]);
      }
    }
  }

  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      const t1 = tiles[i];
      const t2 = tiles[j];

      if (t1.type === t2.type) {
        const path = findPath({ x: t1.x, y: t1.y }, { x: t2.x, y: t2.y }, board);
        if (path) {
          return [{ x: t1.x, y: t1.y }, { x: t2.x, y: t2.y }];
        }
      }
    }
  }

  return null;
};

export const shuffleBoard = (board: TileData[][]): TileData[][] => {
  const rows = board.length;
  const cols = board[0].length;
  const activeTiles: string[] = [];
  const positions: Position[] = [];

  for(let y=0; y<rows; y++) {
    for(let x=0; x<cols; x++) {
      if(!board[y][x].isEmpty) {
        activeTiles.push(board[y][x].type);
        positions.push({x, y});
      }
    }
  }

  activeTiles.sort(() => Math.random() - 0.5);
  const newBoard = board.map(row => row.map(tile => ({...tile})));

  positions.forEach((pos, idx) => {
    newBoard[pos.y][pos.x].type = activeTiles[idx];
    newBoard[pos.y][pos.x].id = `tile-${pos.x}-${pos.y}-${Math.random().toString(36).substr(2, 5)}`;
  });

  return newBoard;
};

export const hasValidMoves = (board: TileData[][]): boolean => {
  return getHintPair(board) !== null;
};