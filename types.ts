
export enum TileType {
  PROPERTY = 'PROPERTY',
  START = 'START',
  CHANCE = 'CHANCE',
  JAIL = 'JAIL',
  PARKING = 'PARKING',
  TAX = 'TAX',
  BANK = 'BANK',
  HOSPITAL = 'HOSPITAL',
  SHOPPING = 'SHOPPING',
  AIRPORT = 'AIRPORT',
  STOCK_MARKET = 'STOCK_MARKET'
}

export enum PlayerType {
  HUMAN = 'HUMAN',
  AI = 'AI'
}

export interface PlayerStockData {
  count: number;
  avgCost: number;
}

export interface Player {
  id: number;
  name: string;
  type: PlayerType;
  money: number;
  position: number; // 0-31 (Outer), 32-47 (Inner)
  color: string;
  isBankrupt: boolean;
  inJail: boolean;
  jailTurns: number;
  
  // New fields
  loan: number;
  isHospitalized: boolean;
  hospitalTurns: number;
  
  // Portfolio: Key is Stock Symbol (e.g., 'AAPL')
  portfolio: Record<string, PlayerStockData>;
  
  avatar: string; // Lucide icon name
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  previousPrice: number;
  history: number[]; // Last 10-20 prices for graph
  color: string;
  volatility: number; // How much it swings
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
  dice: number;
  gamePhase: 'SETUP' | 'WAITING' | 'ROLLING' | 'MOVING' | 'ACTION' | 'EVENT' | 'END_TURN' | 'GAME_OVER' | 'TRADING';
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

export const OUTER_BOARD_SIZE = 32;
export const INNER_BOARD_SIZE = 16;
export const TOTAL_TILES = OUTER_BOARD_SIZE + INNER_BOARD_SIZE; // 48
export const BOARD_SIZE = OUTER_BOARD_SIZE; // Deprecated usage, kept for compatibility if needed
export const INITIAL_MONEY = 1500;
export const PASS_GO_MONEY = 200;