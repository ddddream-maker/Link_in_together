import React, { useEffect, useState, useRef } from 'react';
import { TileData, Position } from '../types';
import { Tile } from './Tile';

interface GameBoardProps {
  board: TileData[][];
  selectedPos: Position | null;
  hintPair: [Position, Position] | null;
  onTileClick: (pos: Position) => void;
  connectionPath: Position[] | null;
  isPaused: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedPos,
  hintPair,
  onTileClick,
  connectionPath,
  isPaused
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Use ResizeObserver for robust sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!board || board.length === 0) return null;

  const totalRows = board.length;
  const totalCols = board[0].length;
  
  // Mobile optimization: Reduce gaps and padding on small screens
  const isMobile = containerSize.width < 600;
  const GAP = isMobile ? 1 : 2; // Tighter gap on mobile
  const PADDING = isMobile ? 0 : 4; // Remove padding on mobile to use full width
  
  // Calculate optimal tile size based on container and grid dimensions
  const availableWidth = Math.max(0, containerSize.width - PADDING * 2);
  const availableHeight = Math.max(0, containerSize.height - PADDING * 2);

  const totalGapsWidth = Math.max(0, (totalCols - 1) * GAP);
  const totalGapsHeight = Math.max(0, (totalRows - 1) * GAP);

  const maxTileWidth = (availableWidth - totalGapsWidth) / totalCols;
  const maxTileHeight = (availableHeight - totalGapsHeight) / totalRows;
  
  // Calculate final size. 
  // Cap at 160px for huge screens. Ensure at least 10px.
  const tileSize = Math.max(10, Math.floor(Math.min(maxTileWidth, maxTileHeight, 160)));
  
  // Grid style
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${totalCols}, ${tileSize}px)`,
    gridTemplateRows: `repeat(${totalRows}, ${tileSize}px)`,
    gap: `${GAP}px`,
    margin: 'auto', // Centers the grid
    width: 'fit-content',
    height: 'fit-content',
    padding: isMobile ? '0' : undefined
  };

  // Helper to check if a position matches
  const isPos = (p: Position | null, x: number, y: number) => p?.x === x && p?.y === y;
  
  // Helper to check if tile is in hint pair
  const isHinted = (x: number, y: number) => {
    if (!hintPair) return false;
    return (hintPair[0].x === x && hintPair[0].y === y) || (hintPair[1].x === x && hintPair[1].y === y);
  };

  // Determine if a specific tile is currently being "popped" (eliminated)
  const isPopping = (x: number, y: number) => {
    if (!connectionPath || connectionPath.length < 2) return false;
    const start = connectionPath[0];
    const end = connectionPath[connectionPath.length - 1];
    return (start.x === x && start.y === y) || (end.x === x && end.y === y);
  };

  // Helper to draw connection line
  const renderConnectionLine = () => {
    if (!connectionPath || connectionPath.length < 2) return null;

    // SVG points calculation must match the grid layout (size + gap)
    const points = connectionPath.map(p => {
        const cx = p.x * (tileSize + GAP) + (tileSize / 2);
        const cy = p.y * (tileSize + GAP) + (tileSize / 2);
        return `${cx},${cy}`;
    }).join(' ');

    return (
      <svg className="absolute top-0 left-0 pointer-events-none z-20" style={{
        width: totalCols * tileSize + (totalCols - 1) * GAP,
        height: totalRows * tileSize + (totalRows - 1) * GAP,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}>
        <polyline 
            points={points} 
            fill="none" 
            stroke="#ef4444"
            strokeWidth={Math.max(3, tileSize / 6)} 
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-md animate-pulse"
        />
      </svg>
    );
  };

  // Generate particles for explosion
  const renderExplosion = (type: string) => {
    const particles = Array.from({ length: 8 });
    const colors = ['bg-red-400', 'bg-yellow-400', 'bg-orange-400', 'bg-green-400'];
    
    return (
      <div className="absolute inset-0 overflow-visible pointer-events-none z-50">
        {particles.map((_, i) => {
          // Scale explosion physics by tile size
          const distance = tileSize * 1.2;
          const tx = (Math.random() - 0.5) * distance * 2;
          const ty = (Math.random() - 0.5) * distance * 2;
          const rot = Math.random() * 360;
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          return (
            <div
              key={i}
              className={`absolute left-1/2 top-1/2 rounded-sm ${color} animate-shatter`}
              style={{
                width: Math.max(3, tileSize / 6),
                height: Math.max(3, tileSize / 6),
                '--tx': `${tx}px`,
                '--ty': `${ty}px`,
                '--rot': `${rot}deg`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div 
        ref={containerRef} 
        className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden"
        style={{ padding: PADDING }}
    >
        <div style={{ position: 'relative' }}>
            {/* Connection Line Layer */}
            {renderConnectionLine()}

            {/* Grid Layer */}
            <div style={gridStyle}>
                {board.flatMap((row, y) => 
                row.map((tile, x) => (
                    <div key={`${x}-${y}`} className="w-full h-full flex items-center justify-center relative">
                         {isPopping(x, y) ? (
                             renderExplosion(tile.type)
                         ) : (
                            <Tile
                                type={tile.type}
                                isEmpty={tile.isEmpty}
                                isSelected={!isPaused && isPos(selectedPos, x, y)}
                                isHinted={!isPaused && isHinted(x, y)}
                                onClick={() => !isPaused && onTileClick({x, y})}
                                sizeClass={`w-full h-full`}
                                fontSize={tileSize * 0.7} // Scaled font size
                                compact={tileSize < 45} // If tiles are small, use compact rendering
                            />
                         )}
                    </div>
                ))
                )}
            </div>
        </div>
        
        {isPaused && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-30 rounded-2xl">
                <span className="text-2xl font-bold text-gray-500">PAUSED</span>
            </div>
        )}
    </div>
  );
};