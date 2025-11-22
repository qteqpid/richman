
import { Tile, TileType, Stock } from './types';

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
  // Inner Loop Colors
  PURPLE: '#800080',
  TEAL: '#008080',
  GRAY: '#808080'
};

export const INITIAL_STOCKS: Stock[] = [
  { symbol: 'NVDA', name: 'NVIDIA', price: 120, previousPrice: 120, history: [110, 115, 112, 118, 120], color: '#76b900', volatility: 0.25 },
  { symbol: 'AAPL', name: 'APPLE', price: 180, previousPrice: 180, history: [175, 176, 178, 179, 180], color: '#A2AAAD', volatility: 0.15 },
  { symbol: 'TSLA', name: 'TESLA', price: 220, previousPrice: 220, history: [200, 210, 205, 215, 220], color: '#e82127', volatility: 0.35 },
  { symbol: 'GOOGL', name: 'GOOGLE', price: 140, previousPrice: 140, history: [135, 136, 138, 139, 140], color: '#4285F4', volatility: 0.18 }
];

export const INITIAL_TILES: Tile[] = [
  // --- OUTER LOOP (0-31) ---
  // Bottom Row (Right to Left): 0 to 8
  { id: 0, name: "Start", type: TileType.START, description: "Collect $200 as you pass." },
  { id: 1, name: "Book Store", type: TileType.PROPERTY, price: 60, baseRent: 2, colorGroup: COLORS.BROWN },
  { id: 2, name: "Bank", type: TileType.BANK, description: "Borrow credits or repay debts." },
  { id: 3, name: "Coffee Shop", type: TileType.PROPERTY, price: 60, baseRent: 4, colorGroup: COLORS.BROWN }, 
  { id: 4, name: "Burger Joint", type: TileType.PROPERTY, price: 80, baseRent: 5, colorGroup: COLORS.BROWN },
  { id: 5, name: "Income Tax", type: TileType.TAX, price: 200, description: "Pay $200 tax." },
  { id: 6, name: "Subway", type: TileType.PROPERTY, price: 100, baseRent: 6, colorGroup: COLORS.LIGHT_BLUE }, 
  { id: 7, name: "Pet Shop", type: TileType.PROPERTY, price: 100, baseRent: 6, colorGroup: COLORS.LIGHT_BLUE },
  
  // Corner (Bottom Left)
  { id: 8, name: "Jail", type: TileType.JAIL, description: "Just visiting..." },

  // Left Column (Bottom to Top): 9 to 16
  { id: 9, name: "Pharmacy", type: TileType.PROPERTY, price: 120, baseRent: 7, colorGroup: COLORS.LIGHT_BLUE }, 
  { id: 10, name: "School", type: TileType.PROPERTY, price: 120, baseRent: 8, colorGroup: COLORS.LIGHT_BLUE },
  { id: 11, name: "Library", type: TileType.PROPERTY, price: 140, baseRent: 9, colorGroup: COLORS.PINK },
  { id: 12, name: "Fire Station", type: TileType.PROPERTY, price: 140, baseRent: 10, colorGroup: COLORS.PINK },
  { id: 13, name: "Hospital", type: TileType.HOSPITAL, description: "Recover for 3 turns." },
  { id: 14, name: "Bakery", type: TileType.PROPERTY, price: 150, baseRent: 11, colorGroup: COLORS.PINK }, 
  { id: 15, name: "Stock Exchange", type: TileType.STOCK_MARKET, description: "Buy/Sell Stocks" }, // Changed from Police Station

  // Corner (Top Left)
  { id: 16, name: "Free Parking", type: TileType.PARKING, description: "Rest here." },

  // Top Row (Left to Right): 17 to 24
  { id: 17, name: "Airport", type: TileType.AIRPORT, description: "Fly to Central Hub." }, 
  { id: 18, name: "Zoo", type: TileType.PROPERTY, price: 180, baseRent: 14, colorGroup: COLORS.ORANGE },
  { id: 19, name: "Chance", type: TileType.CHANCE },
  { id: 20, name: "Aquarium", type: TileType.PROPERTY, price: 200, baseRent: 15, colorGroup: COLORS.ORANGE },
  { id: 21, name: "Cinema", type: TileType.PROPERTY, price: 220, baseRent: 16, colorGroup: COLORS.RED },
  { id: 22, name: "Candy Shop", type: TileType.PROPERTY, price: 230, baseRent: 17, colorGroup: COLORS.RED }, 
  { id: 23, name: "Museum", type: TileType.PROPERTY, price: 240, baseRent: 18, colorGroup: COLORS.RED },

  // Corner (Top Right)
  { id: 24, name: "Go To Jail", type: TileType.CHANCE, description: "Arrested! Pay $100." }, 

  // Right Column (Top to Bottom): 25 to 31
  { id: 25, name: "Music Store", type: TileType.PROPERTY, price: 250, baseRent: 19, colorGroup: COLORS.YELLOW }, 
  { id: 26, name: "Shopping Mall", type: TileType.SHOPPING, description: "Spend random amount up to $100." },
  { id: 27, name: "Gym", type: TileType.PROPERTY, price: 270, baseRent: 21, colorGroup: COLORS.YELLOW },
  { id: 28, name: "Game Center", type: TileType.PROPERTY, price: 280, baseRent: 22, colorGroup: COLORS.YELLOW }, 
  { id: 29, name: "Theme Park", type: TileType.PROPERTY, price: 300, baseRent: 26, colorGroup: COLORS.GREEN },
  { id: 30, name: "Grand Hotel", type: TileType.PROPERTY, price: 350, baseRent: 35, colorGroup: COLORS.BLUE },
  { id: 31, name: "Airport", type: TileType.AIRPORT, description: "Fly to Central Hub." }, // Connects to Inner

  // --- INNER LOOP (32-47) ---
  // Bottom Inner (Right to Left): 32-36
  { id: 32, name: "Central Hub", type: TileType.START, description: "Inner Loop Start. Collect $100." },
  { id: 33, name: "Tech Lab", type: TileType.PROPERTY, price: 150, baseRent: 15, colorGroup: COLORS.PURPLE },
  { id: 34, name: "Arcade", type: TileType.PROPERTY, price: 150, baseRent: 15, colorGroup: COLORS.PURPLE },
  { id: 35, name: "Chance", type: TileType.CHANCE },
  { id: 36, name: "Cyber Café", type: TileType.PROPERTY, price: 180, baseRent: 18, colorGroup: COLORS.PURPLE },

  // Left Inner (Bottom to Top): 37-39
  { id: 37, name: "Clinic", type: TileType.HOSPITAL, description: "Quick heal. 1 turn." }, // Mini Hospital
  { id: 38, name: "Data Center", type: TileType.PROPERTY, price: 200, baseRent: 20, colorGroup: COLORS.TEAL },
  { id: 39, name: "Server Farm", type: TileType.PROPERTY, price: 220, baseRent: 22, colorGroup: COLORS.TEAL },

  // Top Inner (Left to Right): 40-44
  { id: 40, name: "ATM", type: TileType.BANK, description: "Quick Banking" },
  { id: 41, name: "VR Lounge", type: TileType.PROPERTY, price: 240, baseRent: 24, colorGroup: COLORS.TEAL },
  { id: 42, name: "Chance", type: TileType.CHANCE },
  { id: 43, name: "Robot Repair", type: TileType.PROPERTY, price: 260, baseRent: 26, colorGroup: COLORS.GRAY },
  { id: 44, name: "Drone Dock", type: TileType.PROPERTY, price: 280, baseRent: 28, colorGroup: COLORS.GRAY },

  // Right Inner (Top to Bottom): 45-47
  { id: 45, name: "Space Bar", type: TileType.PROPERTY, price: 300, baseRent: 30, colorGroup: COLORS.GRAY },
  { id: 46, name: "Luxury Pods", type: TileType.PROPERTY, price: 350, baseRent: 35, colorGroup: COLORS.GRAY },
  { id: 47, name: "Orbital Shuttle", type: TileType.PROPERTY, price: 400, baseRent: 50, colorGroup: COLORS.BLUE }, 
];