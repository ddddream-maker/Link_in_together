import React from 'react';

interface TileProps {
  type: string;
  isEmpty: boolean;
  isSelected: boolean;
  isHinted: boolean;
  onClick: () => void;
  sizeClass: string;
  fontSize?: number;
  compact?: boolean;
}

export const Tile: React.FC<TileProps> = ({ 
  type, 
  isEmpty, 
  isSelected, 
  isHinted,
  onClick,
  sizeClass,
  fontSize,
  compact = false
}) => {
  if (isEmpty) {
    return <div className={`${sizeClass} invisible`} />;
  }

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClass}
        relative
        flex items-center justify-center
        rounded-md md:rounded-xl
        shadow-sm
        transition-all duration-200
        ${compact ? 'border' : 'border-2'}
        ${isSelected 
          ? 'bg-blue-100 border-blue-500 scale-105 shadow-md z-10' 
          : 'bg-white/95 border-orange-200 hover:border-orange-400 hover:bg-white hover:-translate-y-0.5'
        }
        ${isHinted ? 'animate-bounce ring-4 ring-yellow-400 border-yellow-500' : ''}
      `}
    >
      <span 
        className="leading-none select-none drop-shadow-sm filter transition-all"
        style={{ fontSize: fontSize ? `${fontSize}px` : '1.5rem' }}
      >
        {type}
      </span>
    </button>
  );
};