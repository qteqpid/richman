
import React from 'react';
import Tile from './Tile';
import Dice from './Dice';
import { Tile as TileType, Player, OUTER_BOARD_SIZE, GameState, PlayerType } from '../types';
import { Play } from 'lucide-react';

interface BoardProps {
  tiles: TileType[];
  players: Player[];
  onTileClick?: (tile: TileType) => void;
  dice: number;
  isRolling: boolean;
  onRollDice: () => void;
  phase: GameState['gamePhase'];
  currentPlayer?: Player;
}

const Board: React.FC<BoardProps> = ({ 
  tiles, 
  players, 
  onTileClick,
  dice,
  isRolling,
  onRollDice,
  phase,
  currentPlayer
}) => {
  
  // Grid Layout Logic (9x9 Grid)
  // Outer Loop (0-31): Occupies the perimeter exactly (32 tiles).
  // Inner Loop (32-47): Occupies the 5x5 ring (Rows 3 & 7, Cols 3 & 7).
  
  const getGridStyle = (index: number) => {
    let row = 1;
    let col = 1;

    // --- OUTER LOOP (Perimeter of 9x9) ---
    if (index < OUTER_BOARD_SIZE) {
        // Bottom Row (0-8): Row 9, Cols 9 -> 1
        if (index >= 0 && index <= 8) {
            row = 9;
            col = 9 - index;
        } 
        // Left Column (9-16): Col 1, Rows 9 -> 1
        // Index 8 is (9,1), Index 9 is (8,1), ... Index 16 is (1,1)
        else if (index > 8 && index <= 16) {
            col = 1;
            row = 9 - (index - 8);
        } 
        // Top Row (17-24): Row 1, Cols 1 -> 9
        // Index 16 is (1,1), Index 17 is (1,2), ... Index 24 is (1,9)
        else if (index > 16 && index <= 24) {
            row = 1;
            col = 1 + (index - 16);
        } 
        // Right Column (25-31): Col 9, Rows 1 -> 9
        // Index 24 is (1,9), Index 25 is (2,9), ... Index 31 is (8,9) -> wraps to 0 at (9,9)
        else {
            col = 9;
            row = 1 + (index - 24);
        }
    } 
    // --- INNER LOOP (Ring of 5x5 centered in 9x9 -> Rows/Cols 3-7) ---
    else {
        const innerIdx = index - OUTER_BOARD_SIZE;
        // Bottom Inner (32-36 -> 0-4): Row 7. Cols 7 -> 3
        if (innerIdx >= 0 && innerIdx <= 4) {
            row = 7;
            col = 7 - innerIdx;
        }
        // Left Inner (37-39 -> 5-7): Col 3. Rows 6 -> 4
        else if (innerIdx >= 5 && innerIdx <= 7) {
            col = 3;
            row = 7 - (innerIdx - 4);
        }
        // Top Inner (40-44 -> 8-12): Row 3. Cols 3 -> 7
        else if (innerIdx >= 8 && innerIdx <= 12) {
            row = 3;
            col = 3 + (innerIdx - 8);
        }
        // Right Inner (45-47 -> 13-15): Col 7. Rows 4 -> 6
        else {
            col = 7;
            row = 3 + (innerIdx - 12);
        }
    }
    
    return { gridRowStart: row, gridColumnStart: col };
  };

  return (
    <div className="aspect-square w-full max-w-[900px] mx-auto grid grid-cols-9 grid-rows-9 gap-1 bg-gray-900/50 p-1 rounded-xl shadow-2xl border border-gray-700 relative">
      
      {/* Decorative Grid Lines for the Gap (Ring 2 is empty) */}
      <div className="absolute inset-0 grid grid-cols-9 grid-rows-9 pointer-events-none z-0">
         <div className="col-start-2 col-end-9 row-start-2 row-end-9 border border-dashed border-gray-800/50 rounded-lg"></div>
         <div className="col-start-3 col-end-8 row-start-3 row-end-8 border border-gray-800 rounded-lg"></div>
      </div>

      {/* Center branding/area - 3x3 (Rows 4-6, Cols 4-6) */}
      <div className="col-start-4 col-end-7 row-start-4 row-end-7 bg-gray-900 flex flex-col items-center justify-center border border-gray-800/50 rounded-lg z-0 p-2 text-center shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="mb-2">
             <h1 className="text-xl lg:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple uppercase tracking-widest opacity-90 select-none">
               RichMan
             </h1>
             <h2 className="text-sm lg:text-lg text-white font-thin tracking-[0.3em] opacity-80 select-none">FUN</h2>
        </div>

        {/* Dice Controls */}
        <div className="flex flex-col items-center justify-center gap-2 z-10 w-full">
            <Dice value={dice} rolling={isRolling} />
            
            {phase === 'WAITING' && currentPlayer && currentPlayer.type === PlayerType.HUMAN && (
                 <button 
                   onClick={onRollDice} 
                   disabled={currentPlayer.isHospitalized && currentPlayer.hospitalTurns > 0 && false} 
                   className={`px-6 py-2 ${currentPlayer.isHospitalized ? 'bg-gray-600' : 'bg-neon-blue hover:bg-blue-400'} text-black font-bold rounded-full shadow-[0_0_15px_#00f3ff] transform transition-all hover:scale-105 active:scale-95 flex items-center gap-2`}
                 >
                   <Play size={16} fill="black" /> 
                   {currentPlayer.isHospitalized ? `WAIT (${currentPlayer.hospitalTurns})` : 'ROLL'}
                 </button>
            )}
             
            {/* Status Text */}
             {phase !== 'WAITING' && (
                 <div className="text-xs text-neon-blue animate-pulse font-mono mt-1">
                   {phase === 'ROLLING' && "ROLLING..."}
                   {phase === 'MOVING' && "MOVING..."}
                   {phase === 'ACTION' && "ACTION REQUIRED"}
                   {phase === 'EVENT' && "EVENT..."}
                   {phase === 'END_TURN' && "NEXT TURN..."}
                 </div>
             )}
        </div>
      </div>

      {/* Tiles */}
      {tiles.map((tile) => (
        <div key={tile.id} style={getGridStyle(tile.id)} className="w-full h-full z-10 relative">
          <Tile 
            tile={tile} 
            playersOnTile={players.filter(p => p.position === tile.id)}
            owner={tile.ownerId !== undefined && tile.ownerId !== null ? players.find(p => p.id === tile.ownerId) : undefined}
            onClick={onTileClick}
          />
        </div>
      ))}
    </div>
  );
};

export default Board;
