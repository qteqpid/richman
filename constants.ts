import { Tile, TileType, BOARD_SIZE } from './types';

// Colors for property groups
const COLORS = {
  BROWN: '#8B4513',
  LIGHT_BLUE: '#87CEEB',
  PINK: '#FF69B4',
  ORANGE: '#FFA500',
  RED: '#FF0000',
  YELLOW: '#FFFF00',
  GREEN: '#008000',
  BLUE: '#0000FF',
};

export const INITIAL_TILES: Tile[] = [
  // Bottom Row (Right to Left): 0 to 6
  { id: 0, name: "Start Base", type: TileType.START, description: "Collect $200 as you pass." },
  { id: 1, name: "Old Slums", type: TileType.PROPERTY, price: 60, baseRent: 2, colorGroup: COLORS.BROWN },
  
  // CHANGED: Community Chest -> Bank
  { id: 2, name: "Neo Bank", type: TileType.BANK, description: "Borrow credits or repay debts." },
  
  { id: 3, name: "Rusty Shack", type: TileType.PROPERTY, price: 60, baseRent: 4, colorGroup: COLORS.BROWN },
  { id: 4, name: "Income Tax", type: TileType.TAX, price: 200, description: "Pay $200 to the corrupt gov." },
  { id: 5, name: "Cyber Hub", type: TileType.PROPERTY, price: 100, baseRent: 6, colorGroup: COLORS.LIGHT_BLUE },
  
  // Corner
  { id: 6, name: "Crypto Jail", type: TileType.JAIL, description: "Just visiting... or are you?" },

  // Left Column (Bottom to Top): 7 to 11
  { id: 7, name: "Neon Alley", type: TileType.PROPERTY, price: 100, baseRent: 6, colorGroup: COLORS.LIGHT_BLUE },
  { id: 8, name: "Data Stream", type: TileType.PROPERTY, price: 120, baseRent: 8, colorGroup: COLORS.LIGHT_BLUE },
  { id: 9, name: "Pink District", type: TileType.PROPERTY, price: 140, baseRent: 10, colorGroup: COLORS.PINK },
  
  // CHANGED: Power Plant -> Hospital
  { id: 10, name: "Medi-Pod", type: TileType.HOSPITAL, description: "Recover for 3 turns." },
  
  { id: 11, name: "Holo Park", type: TileType.PROPERTY, price: 140, baseRent: 10, colorGroup: COLORS.PINK },

  // Corner
  { id: 12, name: "Free Parking", type: TileType.PARKING, description: "Rest your neural link here." },

  // Top Row (Left to Right): 13 to 17
  { id: 13, name: "Orange Zone", type: TileType.PROPERTY, price: 160, baseRent: 12, colorGroup: COLORS.ORANGE },
  { id: 14, name: "Chance Uplink", type: TileType.CHANCE },
  { id: 15, name: "Amber Plaza", type: TileType.PROPERTY, price: 180, baseRent: 14, colorGroup: COLORS.ORANGE },
  { id: 16, name: "Red Sector", type: TileType.PROPERTY, price: 200, baseRent: 16, colorGroup: COLORS.RED },
  { id: 17, name: "Mars Colony", type: TileType.PROPERTY, price: 220, baseRent: 18, colorGroup: COLORS.RED },

  // Corner
  { id: 18, name: "Go To Jail", type: TileType.CHANCE, description: "Caught hacking. Go to Jail." }, // Special logic needed

  // Right Column (Top to Bottom): 19 to 23
  { id: 19, name: "Solar Farm", type: TileType.PROPERTY, price: 240, baseRent: 20, colorGroup: COLORS.YELLOW },
  { id: 20, name: "Fusion Lab", type: TileType.PROPERTY, price: 260, baseRent: 22, colorGroup: COLORS.YELLOW },
  { id: 21, name: "Green Belt", type: TileType.PROPERTY, price: 300, baseRent: 26, colorGroup: COLORS.GREEN },
  { id: 22, name: "Luxury Spire", type: TileType.PROPERTY, price: 350, baseRent: 35, colorGroup: COLORS.BLUE },
  { id: 23, name: "Cloud City", type: TileType.PROPERTY, price: 400, baseRent: 50, colorGroup: COLORS.BLUE },
];