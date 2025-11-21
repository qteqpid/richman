import React from 'react';
import Tile from './Tile';
import { Tile as TileType, Player, BOARD_SIZE } from '../types';

interface BoardProps {
  tiles: TileType[];
  players: Player[];
}

const Board: React.FC<BoardProps> = ({ tiles, players }) => {
  
  // We need to map the linear 0-23 index to grid positions in a 7x7 grid.
  // Indices:
  // Bottom Row (Right to Left): 0 -> 6
  // Left Col (Bottom to Top): 6 -> 12
  // Top Row (Left to Right): 12 -> 18
  // Right Col (Top to Bottom): 18 -> 0
  
  const getGridStyle = (index: number) => {
    const GRID_SIZE = 7;
    let row = 1;
    let col = 1;

    if (index >= 0 && index <= 6) {
      // Bottom Row: Row 7, Cols 7 down to 1
      row = GRID_SIZE;
      col = GRID_SIZE - index;
    } else if (index > 6 && index <= 12) {
      // Left Column: Cols 1, Rows 7 down to 1
      col = 1;
      row = GRID_SIZE - (index - 6);
    } else if (index > 12 && index <= 18) {
      // Top Row: Row 1, Cols 1 to 7
      row = 1;
      col = 1 + (index - 12);
    } else {
      // Right Column: Col 7, Rows 1 to 7
      col = GRID_SIZE;
      row = 1 + (index - 18);
    }
    return { gridRowStart: row, gridColumnStart: col };
  };

  return (
    <div className="aspect-square w-full max-w-[800px] mx-auto grid grid-cols-7 grid-rows-7 gap-1 bg-gray-800 p-1 rounded-xl shadow-2xl border border-gray-700 relative">
      
      {/* Center branding/area */}
      <div className="col-start-2 col-end-7 row-start-2 row-end-7 bg-gray-900 flex flex-col items-center justify-center border border-gray-800/50 rounded-lg z-0">
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple uppercase tracking-widest opacity-80 select-none">
          RichMan
        </h1>
        <h2 className="text-2xl text-white font-thin tracking-[0.5em] opacity-80 select-none">FUN</h2>
        <div className="mt-8 text-gray-600 text-xs animate-pulse">AI Thinking...</div>
      </div>

      {/* Tiles */}
      {tiles.map((tile) => (
        <div key={tile.id} style={getGridStyle(tile.id)} className="w-full h-full z-10">
          <Tile 
            tile={tile} 
            playersOnTile={players.filter(p => p.position === tile.id)}
            owner={tile.ownerId !== undefined && tile.ownerId !== null ? players.find(p => p.id === tile.ownerId) : undefined}
          />
        </div>
      ))}
    </div>
  );
};

export default Board;