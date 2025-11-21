export enum TileType {
  PROPERTY = 'PROPERTY',
  START = 'START',
  CHANCE = 'CHANCE',
  JAIL = 'JAIL',
  PARKING = 'PARKING',
  TAX = 'TAX',
  BANK = 'BANK',
  HOSPITAL = 'HOSPITAL'
}

export enum PlayerType {
  HUMAN = 'HUMAN',
  AI = 'AI'
}

export interface Player {
  id: number;
  name: string;
  type: PlayerType;
  money: number;
  position: number; // 0-23
  color: string;
  isBankrupt: boolean;
  inJail: boolean;
  jailTurns: number;
  
  // New fields
  loan: number;
  isHospitalized: boolean;
  hospitalTurns: number;
  
  avatar: string; // Lucide icon name
}

export interface Tile {
  id: number;
  name: string;
  type: TileType;
  price?: number;
  baseRent?: number;
  ownerId?: number | null;
  houseCount?: number; // 0-5
  colorGroup?: string; // Hex color
  description?: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  tiles: Tile[];
  dice: [number, number];
  gamePhase: 'SETUP' | 'WAITING' | 'ROLLING' | 'MOVING' | 'ACTION' | 'EVENT' | 'END_TURN' | 'GAME_OVER';
  turnCount: number;
  logs: GameLog[];
  isGeminiThinking: boolean;
  geminiCommentary: string | null;
}

export interface GameLog {
  id: string;
  message: string;
  type: 'info' | 'success' | 'danger' | 'warning' | 'ai';
  timestamp: number;
}

export const BOARD_SIZE = 24;
export const INITIAL_MONEY = 1500;
export const PASS_GO_MONEY = 200;