
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, PlayerType, TileType, INITIAL_MONEY, PASS_GO_MONEY, OUTER_BOARD_SIZE, INNER_BOARD_SIZE, Tile, GameLog, Stock } from './types';
import { INITIAL_TILES, INITIAL_STOCKS } from './constants';
import Board from './components/Board';
import GameLogView from './components/GameLog';
import { getGeminiCommentary, generateChanceEvent } from './services/geminiService';
import { playDiceRoll, playMove, playPurchase, playPayment, playMoneyGain, speakText } from './services/audioService';
import { DollarSign, User, Cpu, Play, SkipForward, Building2, Bot, Smile, Crown, Skull, Rocket, Ghost, Gamepad2, Zap, X, Plane, TrendingUp, TrendingDown, LineChart, ArrowRight, Briefcase } from 'lucide-react';

const AVAILABLE_AVATARS = [
    { id: 'user', icon: <User size={20} /> },
    { id: 'smile', icon: <Smile size={20} /> },
    { id: 'zap', icon: <Zap size={20} /> },
    { id: 'crown', icon: <Crown size={20} /> },
    { id: 'skull', icon: <Skull size={20} /> },
    { id: 'rocket', icon: <Rocket size={20} /> },
    { id: 'ghost', icon: <Ghost size={20} /> },
    { id: 'gamepad', icon: <Gamepad2 size={20} /> },
];

const TILE_NAME_TRANSLATIONS: Record<string, string> = {
  "Start": "起点",
  "Book Store": "书店",
  "Bank": "银行",
  "Coffee Shop": "咖啡店",
  "Burger Joint": "汉堡店",
  "Income Tax": "所得税",
  "Subway": "地铁站",
  "Pet Shop": "宠物店",
  "Jail": "监狱",
  "Pharmacy": "药房",
  "School": "学校",
  "Library": "图书馆",
  "Fire Station": "消防站",
  "Hospital": "医院",
  "Bakery": "面包店",
  "Police Station": "警察局",
  "Free Parking": "免费停车场",
  "Toy Store": "玩具店",
  "Zoo": "动物园",
  "Chance": "机会",
  "Aquarium": "水族馆",
  "Cinema": "电影院",
  "Candy Shop": "糖果店",
  "Museum": "博物馆",
  "Go To Jail": "入狱",
  "Music Store": "音像店",
  "Shopping Mall": "购物中心",
  "Gym": "健身房",
  "Game Center": "游戏中心",
  "Theme Park": "主题公园",
  "Grand Hotel": "大酒店",
  "Airport": "机场",
  // Inner Loop Translations
  "Central Hub": "中央枢纽",
  "Tech Lab": "科技实验室",
  "Arcade": "街机厅",
  "Cyber Café": "网吧",
  "Clinic": "诊所",
  "Data Center": "数据中心",
  "Server Farm": "服务器农场",
  "ATM": "自动取款机",
  "VR Lounge": "VR 休息室",
  "Robot Repair": "机器人修理",
  "Drone Dock": "无人机码头",
  "Space Bar": "太空酒吧",
  "Luxury Pods": "豪华舱",
  "Orbital Shuttle": "轨道穿梭机"
};

const App: React.FC = () => {
  // Setup State
  const [playerCount, setPlayerCount] = useState<2 | 3>(2);
  const [p1Name, setP1Name] = useState('Human');
  const [p1Avatar, setP1Avatar] = useState('user');
  const [p2Name, setP2Name] = useState('Human 2');
  const [p2Avatar, setP2Avatar] = useState('smile');

  // Game State
  const [tiles, setTiles] = useState<Tile[]>(INITIAL_TILES);
  const [dice, setDice] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  
  // Rolling Lock to prevent double-clicks/race conditions
  const isRollingRef = useRef(false);
  
  // Movement Interruption State
  const [remainingMoves, setRemainingMoves] = useState<number>(0);
  
  // Stock Market State
  const [marketStocks, setMarketStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [totalRolls, setTotalRolls] = useState(0);
  const [showStockMarket, setShowStockMarket] = useState(false);
  const [pendingDiceResult, setPendingDiceResult] = useState<number | null>(null);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>(INITIAL_STOCKS[0].symbol);
  const [tradeQuantity, setTradeQuantity] = useState<number>(1);

  // Initial players state will be set after setup
  const [players, setPlayers] = useState<Player[]>([]);
  
  // Ref to track players state in async functions to avoid stale closures
  const playersRef = useRef<Player[]>([]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [phase, setPhase] = useState<GameState['gamePhase']>('SETUP');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [pendingAction, setPendingAction] = useState<{type: 'BUY_PROMPT' | 'CHANCE' | 'BANK', tile?: Tile, eventData?: any} | null>(null);
  
  // Info Modal State
  const [selectedTileInfo, setSelectedTileInfo] = useState<Tile | null>(null);

  // Helper to add logs
  const addLog = useCallback((message: string, type: GameLog['type'] = 'info') => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), message, type, timestamp: Date.now() }]);
  }, []);

  const currentPlayer = players[currentPlayerIndex];

  // --- Setup Logic ---
  const startGame = () => {
      const newPlayers: Player[] = [];

      // Player 1 (Human)
      newPlayers.push({
          id: 0,
          name: p1Name || 'Player 1',
          type: PlayerType.HUMAN,
          money: INITIAL_MONEY,
          position: 0,
          color: '#00f3ff',
          isBankrupt: false,
          inJail: false,
          jailTurns: 0,
          loan: 0,
          isHospitalized: false,
          hospitalTurns: 0,
          portfolio: {},
          avatar: p1Avatar
      });

      if (playerCount === 3) {
          // Player 2 (Human)
          newPlayers.push({
              id: 1,
              name: p2Name || 'Player 2',
              type: PlayerType.HUMAN,
              money: INITIAL_MONEY,
              position: 0,
              color: '#00ff00', // Neon Green for P2
              isBankrupt: false,
              inJail: false,
              jailTurns: 0,
              loan: 0,
              isHospitalized: false,
              hospitalTurns: 0,
              portfolio: {},
              avatar: p2Avatar
          });
          
          // Player 3 (AI)
          newPlayers.push({
              id: 2,
              name: "Robot",
              type: PlayerType.AI,
              money: INITIAL_MONEY,
              position: 0,
              color: '#bd00ff',
              isBankrupt: false,
              inJail: false,
              jailTurns: 0,
              loan: 0,
              isHospitalized: false,
              hospitalTurns: 0,
              portfolio: {},
              avatar: 'bot'
          });
      } else {
          // Player 2 (AI) - Standard 1v1
           newPlayers.push({
              id: 1,
              name: "Robot",
              type: PlayerType.AI,
              money: INITIAL_MONEY,
              position: 0,
              color: '#bd00ff',
              isBankrupt: false,
              inJail: false,
              jailTurns: 0,
              loan: 0,
              isHospitalized: false,
              hospitalTurns: 0,
              portfolio: {},
              avatar: 'bot'
          });
      }
      
      setPlayers(newPlayers);
      setPhase('WAITING');
      addLog("Welcome to RichMan Fun! Game Started.", 'success');
  };

  // --- Game Logic Actions ---

  // Trigger AI Commentary
  const triggerAICommentary = async (event: string) => {
    if (!currentPlayer) return;
    const summary = `Phase: ${phase}. ${currentPlayer.name} has $${currentPlayer.money} and $${currentPlayer.loan} debt.`;
    const comment = await getGeminiCommentary(currentPlayer.name, event, summary);
    addLog(comment, 'ai');
  };

  const rollDice = useCallback(() => {
    // Strict locking to prevent double-rolls causing race conditions
    if (phase !== 'WAITING' || isRollingRef.current) return;
    
    // Check Hospital Status
    if (currentPlayer.isHospitalized) {
        setPlayers(prev => {
            const updated = [...prev];
            updated[currentPlayerIndex].hospitalTurns -= 1;
            return updated;
        });

        const turnsLeft = currentPlayer.hospitalTurns - 1;
        addLog(`${currentPlayer.name} is recovering in hospital. (${turnsLeft} turns left)`, 'warning');
        
        if (turnsLeft <= 0) {
            setPlayers(prev => {
                const updated = [...prev];
                updated[currentPlayerIndex].isHospitalized = false;
                return updated;
            });
            addLog(`${currentPlayer.name} has been discharged from the hospital!`, 'success');
        }
        endTurn();
        return;
    }

    playDiceRoll(); // Sound Effect
    isRollingRef.current = true;
    setIsRolling(true);
    setPhase('ROLLING');
    
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      
      // Stock Market Update Logic
      const newTotalRolls = totalRolls + 1;
      setTotalRolls(newTotalRolls);

      // Fluctuate ALL Stocks
      setMarketStocks(prevStocks => {
        return prevStocks.map(stock => {
            // Volatility factor
            const changePercent = (Math.random() * (stock.volatility * 2)) - stock.volatility; // e.g., -0.15 to +0.15
            const newPrice = Math.max(10, Math.floor(stock.price * (1 + changePercent)));
            const newHistory = [...stock.history, newPrice].slice(-10); // Keep last 10 points
            return {
                ...stock,
                previousPrice: stock.price,
                price: newPrice,
                history: newHistory
            };
        });
      });

      setDice(d1);
      isRollingRef.current = false;
      setIsRolling(false);
      
      // Check if Stock Market Popup triggers (Every 10 rolls)
      if (newTotalRolls % 10 === 0) {
         setPhase('TRADING'); // Explicit Trading Phase
         addLog("STOCK MARKET IS OPEN! Prices updated.", 'warning');
         speakText("Stock market open");
         setPendingDiceResult(d1);
         setTradeQuantity(1); // Reset input
         setShowStockMarket(true);
         
         // Handle AI auto-trading immediately if it's AI turn
         // IMPORTANT: Use closure variable currentPlayer to check type safely
         if (currentPlayer.type === PlayerType.AI) {
             handleAIStockTrading();
         }
         return;
      }

      setPhase('MOVING');
      addLog(`${currentPlayer.name} rolled ${d1}`, 'info');
      movePlayer(d1);
    }, 1000);
  }, [phase, currentPlayer, players, currentPlayerIndex, totalRolls]);

  const handleAIStockTrading = () => {
      const ai = playersRef.current[currentPlayerIndex];
      
      // Safety: Ensure we are actually dealing with an AI player
      if (ai.type !== PlayerType.AI) return;

      // AI Strategy: Randomly pick a stock to analyze
      setTimeout(() => {
          let actionTaken = false;
          
          // Try to buy or sell based on random stock choice
          const stock = marketStocks[Math.floor(Math.random() * marketStocks.length)];
          
          if (stock && stock.price < 100 && ai.money > 400) {
              // Cheap, buy
              const affordable = Math.floor((ai.money * 0.3) / stock.price);
              const amount = Math.min(affordable, 5);
              if (amount > 0) {
                  handleStockTransaction(stock.symbol, amount, 'BUY', true);
                  actionTaken = true;
              }
          } else if (stock) {
              // Maybe sell?
              const owned = ai.portfolio[stock.symbol]?.count || 0;
              if (owned > 0 && stock.price > stock.previousPrice) {
                  handleStockTransaction(stock.symbol, owned, 'SELL', true);
                  actionTaken = true;
              }
          }

          if (!actionTaken) {
              addLog(`${ai.name} holds their positions.`, 'info');
          }

          // Close market for AI automatically
          setTimeout(() => {
             closeStockMarketAndMove();
          }, 1500);
      }, 1000);
  };

  const closeStockMarketAndMove = () => {
      setShowStockMarket(false);
      setPhase('MOVING');
      if (pendingDiceResult) {
          addLog(`${currentPlayer.name} proceeds with roll ${pendingDiceResult}`, 'info');
          movePlayer(pendingDiceResult);
          setPendingDiceResult(null);
      }
  };

  const handleStockTransaction = (symbol: string, amount: number, type: 'BUY' | 'SELL', isAI = false) => {
     if (amount <= 0) return;

     // Use ref to ensure latest state is used during trading phase
     const p = playersRef.current[currentPlayerIndex];
     const stock = marketStocks.find(s => s.symbol === symbol);
     if (!stock) return;

     const cost = amount * stock.price;
     const currentHolding = p.portfolio[symbol] || { count: 0, avgCost: 0 };
     
     if (type === 'BUY') {
         if (p.money >= cost) {
             setPlayers(prev => {
                 const updated = [...prev];
                 const pl = { ...updated[p.id] }; // Shallow copy player
                 pl.portfolio = { ...pl.portfolio }; // Shallow copy portfolio
                 
                 // Calculate new weighted average cost
                 const totalOldCost = currentHolding.count * currentHolding.avgCost;
                 const totalNewCost = amount * stock.price;
                 const newCount = currentHolding.count + amount;
                 const newAvg = Math.floor((totalOldCost + totalNewCost) / newCount);
                 
                 pl.money -= cost;
                 pl.portfolio[symbol] = { count: newCount, avgCost: newAvg };
                 updated[p.id] = pl;
                 return updated;
             });
             addLog(`${p.name} bought ${amount} ${symbol} @ $${stock.price}.`, 'success');
             playPurchase();
         } else if (!isAI) {
             addLog("Not enough funds!", 'danger');
         }
     } else {
         if (currentHolding.count >= amount) {
             const profitPerShare = stock.price - currentHolding.avgCost;
             const totalProfit = profitPerShare * amount;
             
             setPlayers(prev => {
                 const updated = [...prev];
                 const pl = { ...updated[p.id] };
                 pl.portfolio = { ...pl.portfolio };
                 
                 pl.money += cost;
                 pl.portfolio[symbol] = {
                     count: currentHolding.count - amount,
                     avgCost: currentHolding.avgCost // Avg cost doesn't change on sell
                 };
                 
                 if (pl.portfolio[symbol].count === 0) {
                     delete pl.portfolio[symbol];
                 }
                 updated[p.id] = pl;
                 return updated;
             });
             
             const msgType = totalProfit >= 0 ? 'success' : 'warning';
             const profitMsg = totalProfit >= 0 ? `Profit: $${totalProfit}` : `Loss: $${Math.abs(totalProfit)}`;
             addLog(`${p.name} sold ${amount} ${symbol}. ${profitMsg}`, msgType);
             playMoneyGain();
         } else if (!isAI) {
             addLog("Not enough shares!", 'danger');
         }
     }
  };

  const movePlayer = async (steps: number, overridePlayer?: Player) => {
    const currentPlayerId = currentPlayerIndex;
    // Use local copy for calculations to avoid stale state during async loop.
    // If overridePlayer is provided (from Bank logic), use that as the source of truth.
    let p = overridePlayer ? { ...overridePlayer } : { ...playersRef.current[currentPlayerId] };
    let currentPos = p.position;

    for (let i = 0; i < steps; i++) {
        // Animation Delay - Slowed down
        await new Promise(resolve => setTimeout(resolve, 500));

        // Determine Loop Logic
        const isOuter = currentPos < OUTER_BOARD_SIZE;
        const loopMin = isOuter ? 0 : OUTER_BOARD_SIZE;
        const loopMax = isOuter ? OUTER_BOARD_SIZE : (OUTER_BOARD_SIZE + INNER_BOARD_SIZE);
        
        currentPos = currentPos + 1;
        
        // Logic change: If completing Inner Loop (passing max Inner), go to Airport (31)
        // instead of looping back to Central Hub (32).
        if (!isOuter && currentPos >= loopMax) {
             currentPos = 31; // Airport (Outer Loop End/Start junction)
             addLog(`${p.name} leaves the Inner Loop via flight route.`, 'info');
             // No money for leaving inner loop unless handled by next step (passing 31->0)
        }
        // Logic: Standard Wrapping
        else if (currentPos >= loopMax) {
            currentPos = loopMin;
            
            // Pass Go Logic (Outer loop only)
            if (isOuter) { 
                p.money += PASS_GO_MONEY;
                playMoneyGain();
                addLog(`${p.name} passed Start! Collected $${PASS_GO_MONEY}`, 'success');
                
                if (p.loan > 0) {
                    const interest = Math.ceil(p.loan * 0.1);
                    p.loan += interest;
                    playPayment();
                    addLog(`Loan Interest! Debt increased by $${interest} (Total: $${p.loan})`, 'danger');
                }
            } else {
                 // Inner Loop Start is 32 "Central Hub"
                 p.money += 100; 
                 playMoneyGain();
                 addLog(`${p.name} passed Central Hub! Collected $100`, 'success');
            }
        }

        p.position = currentPos;
        
        // Sound
        playMove();

        // Update UI State
        setPlayers(prev => {
            const updated = [...prev];
            updated[currentPlayerId] = { ...p };
            return updated;
        });

        // Check for Bank/ATM Passing Trigger (Walk-by rule)
        // Dynamically check if current tile is BANK type
        const currentTile = tiles.find(t => t.id === currentPos);
        const isBank = currentTile?.type === TileType.BANK;
        const stepsLeft = steps - 1 - i;
        
        // If passing bank (not landing on it as final step), interrupt movement
        if (isBank && stepsLeft > 0) {
             addLog(`${p.name} passes the ${currentTile?.name || 'Bank'}...`, 'info');
             setRemainingMoves(stepsLeft);
             setPhase('ACTION');
             
             if (p.type === PlayerType.HUMAN) {
                 setPendingAction({ type: 'BANK', tile: currentTile });
             } else {
                 // AI Logic handling the interruption
                 // Pass current 'p' to ensure AI has the correct position reference
                 const aiCurrentState = { ...p };
                 setTimeout(() => {
                     handleAIBankLogic(aiCurrentState);
                 }, 1000);
             }
             return; // Exit the loop immediately
        }
    }
    
    // Animation complete, wait a beat then evaluate
    await new Promise(resolve => setTimeout(resolve, 300));
    evaluateTile(p);
  };

  const handleAIBankLogic = (aiPlayer: Player) => {
      // Decision Logic
      if (aiPlayer.money < 200 && aiPlayer.loan < 1000) {
          handleBankAction('BORROW');
      } else if (aiPlayer.loan > 0 && aiPlayer.money > aiPlayer.loan + 300) {
          handleBankAction('REPAY');
      } else {
          // Do nothing, just exit
          handleExitBank(aiPlayer);
      }
  };

  const evaluateTile = async (player: Player, tilePassed?: Tile) => {
    const tile = tiles.find(t => t.id === player.position);
    if (!tile) return;

    // Speak block name
    speakText(tile.name);

    addLog(`${player.name} landed on ${tile.name}`, 'info');

    // Check for Airport Teleportation
    if (tile.type === TileType.AIRPORT) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const targetName = "Central Hub";
        const targetTile = tiles.find(t => t.name === targetName);
        
        if (targetTile) {
            playMove(); // Sound
            addLog(`Boarding flight to ${targetTile.name}...`, 'warning');
            
            setPlayers(prev => {
                const updated = [...prev];
                updated[player.id].position = targetTile.id;
                return updated;
            });
            
            setTimeout(() => handlePostTeleportLogic(player.id, targetTile), 1000);
            return;
        }
    }

    handleStandardTileLogic(player, tile);
  };
  
  const handlePostTeleportLogic = (playerId: number, tile: Tile) => {
      const p = playersRef.current[playerId];
      handleStandardTileLogic(p, tile);
  }

  const handleStandardTileLogic = (player: Player, tile: Tile) => {
    if (tile.type === TileType.PROPERTY) {
      if (tile.ownerId === undefined || tile.ownerId === null) {
        // Unowned
        if (player.money >= (tile.price || 0)) {
          setPhase('ACTION');
          if (player.type === PlayerType.HUMAN) {
             setPendingAction({ type: 'BUY_PROMPT', tile });
          } else {
             // AI Logic: Buy if can afford and has buffer
             if (player.money > (tile.price || 0) + 200) {
               handleBuyProperty(player, tile);
             } else {
               addLog(`${player.name} decides not to buy ${tile.name}.`, 'info');
               endTurn();
             }
          }
        } else {
          addLog(`${player.name} cannot afford ${tile.name}.`, 'warning');
          endTurn();
        }
      } else if (tile.ownerId !== player.id) {
        // Pay Rent
        const owner = playersRef.current.find(pl => pl.id === tile.ownerId);
        const rent = calculateRent(tile);
        handlePayRent(player, owner!, rent);
      } else {
         addLog("Relaxing at own property.", 'info');
         endTurn();
      }
    } else if (tile.type === TileType.SHOPPING) {
        // Shopping Mall Logic: Pay random amount <= 100
        const cost = Math.floor(Math.random() * 100) + 1;
        playPayment();
        setPlayers(prev => {
            const updated = [...prev];
            updated[player.id].money -= cost;
            return updated;
        });
        addLog(`${player.name} went shopping and spent $${cost}.`, 'warning');
        endTurn();
    } else if (tile.type === TileType.BANK) {
        setPhase('ACTION');
        if (player.type === PlayerType.HUMAN) {
            setPendingAction({ type: 'BANK', tile });
        } else {
            // AI Logic for Bank (Landing)
            handleAIBankLogic(player);
        }
    } else if (tile.type === TileType.HOSPITAL) {
        // Check for Clinic (Short stay) vs Hospital (Long stay)
        const isClinic = tile.name === "Clinic";
        const turns = isClinic ? 1 : 3;
        
        setPlayers(prev => {
            const updated = [...prev];
            updated[player.id].isHospitalized = true;
            updated[player.id].hospitalTurns = turns;
            return updated;
        });
        addLog(`${player.name} admitted to ${tile.name}. Must rest for ${turns} turn(s).`, 'danger');
        playPayment();
        endTurn();
    } else if (tile.type === TileType.CHANCE || tile.type === TileType.JAIL || tile.type === TileType.TAX || tile.type === TileType.PARKING) {
       handleSpecialTile(player, tile);
    } else {
       endTurn();
    }
  };

  const calculateRent = (tile: Tile) => {
    return (tile.baseRent || 10) * ((tile.houseCount || 0) + 1);
  };

  const handlePayRent = (payer: Player, owner: Player, amount: number) => {
    let actualAmount = 0;
    
    setPlayers(prev => {
        const updated = [...prev];
        const p = { ...updated[payer.id] };
        const o = { ...updated[owner.id] };
        
        actualAmount = Math.min(p.money, amount);
        p.money -= actualAmount;
        o.money += actualAmount;
        
        updated[payer.id] = p;
        updated[owner.id] = o;
        return updated;
    });

    // Re-calculate amount for logs since setPlayers is async/batched
    actualAmount = Math.min(payer.money, amount);
    playPayment(); // Sound Effect

    addLog(`${payer.name} paid $${actualAmount} rent to ${owner.name}.`, 'danger');
    if (payer.type === PlayerType.HUMAN && actualAmount > 50) {
        triggerAICommentary("High Rent Payment");
    }

    // Check bankruptcy on 'latest' logic, though technically state update is pending.
    if (payer.money - actualAmount <= 0) {
       handleBankruptcy(payer);
    } else {
       endTurn();
    }
  };

  const handleBuyProperty = (player: Player, tile: Tile) => {
    const cost = tile.price || 0;
    playPurchase(); // Sound Effect

    setPlayers(prev => {
        const updated = [...prev];
        updated[player.id].money -= cost;
        return updated;
    });

    const updatedTiles = tiles.map(t => t.id === tile.id ? { ...t, ownerId: player.id } : t);
    setTiles(updatedTiles);

    addLog(`${player.name} bought ${tile.name} for $${cost}.`, 'success');
    
    if (player.type === PlayerType.HUMAN) {
       triggerAICommentary("Player Bought Property");
    }

    setPendingAction(null);
    endTurn();
  };
  
  const handleBankAction = (action: 'BORROW' | 'REPAY') => {
      const playerId = currentPlayerIndex;
      
      // Calculate new values based on Ref (Safe Source of Truth)
      // Create a new object reference to ensure immutability
      // We create a fresh copy of the player object
      const p = { ...playersRef.current[playerId] };
      
      if (action === 'BORROW') {
          const loanAmount = 500;
          const interestInitial = 50;
          p.money += loanAmount;
          p.loan += (loanAmount + interestInitial);
      } else {
          const repayAmount = Math.min(p.money, p.loan);
          p.money -= repayAmount;
          p.loan -= repayAmount;
      }

      // IMPORTANT: Update React State AND pass this specific object to handleExitBank
      setPlayers(prev => {
          const updated = [...prev];
          updated[playerId] = p; 
          return updated;
      });
      
      // Logs
      if (action === 'BORROW') {
           playMoneyGain();
           addLog(`${p.name} borrowed money. Balance: $${p.money}`, 'warning');
      } else {
           playPayment();
           addLog(`${p.name} repaid debt. Balance: $${p.money}`, 'success');
      }
      
      // Resume movement with the FRESH player object
      handleExitBank(p);
  };
  
  const handleExitBank = (updatedPlayer?: Player) => {
      setPendingAction(null);
      
      // Use provided player or fallback to ref if user just clicked 'Leave' without transaction
      // Ensure we are using the MOST recent player state if a transaction occurred
      const p = updatedPlayer ? updatedPlayer : { ...playersRef.current[currentPlayerIndex] };

      if (remainingMoves > 0) {
          addLog(`${p.name} continues moving (${remainingMoves} steps)...`, 'info');
          const moves = remainingMoves;
          setRemainingMoves(0);
          // CRITICAL: Resume movePlayer with the UPDATED player state
          movePlayer(moves, p);
      } else {
          endTurn();
      }
  };

  const handleSpecialTile = async (player: Player, tile: Tile) => {
     if (tile.type === TileType.TAX) {
        const tax = tile.price || 100;
        playPayment(); 
        setPlayers(prev => {
            const updated = [...prev];
            updated[player.id].money -= tax;
            return updated;
        });
        addLog(`Paid $${tax} tax.`, 'danger');
        endTurn();
     } else if (tile.type === TileType.JAIL) {
        addLog("Just visiting jail.", 'info');
        endTurn();
     } else if (tile.id === 24) { // Go To Jail (New ID)
        playPayment(); 
        const fine = 100;
        addLog(`ARRESTED! Sent to Jail and fined $${fine}.`, 'danger');
        
        setPlayers(prev => {
            const updated = [...prev];
            updated[player.id].position = 8; // Jail index
            updated[player.id].inJail = true;
            updated[player.id].money -= fine; // Deduct fine
            return updated;
        });
        endTurn();
     } else if (tile.type === TileType.CHANCE) {
        setPhase('EVENT');
        addLog("Accessing Chance mainframe...", 'info');
        
        const event = await generateChanceEvent();
        setPendingAction({ type: 'CHANCE', eventData: event });
        
        if (player.type === PlayerType.AI) {
            setTimeout(() => applyChanceEffect(player, event), 2000);
        }
     } else if (tile.type === TileType.PARKING) {
         addLog("Parking... Safe for now.", 'info');
         endTurn();
     }
  };

  const applyChanceEffect = (player: Player, event: {description: string, effectType: string, value: number}) => {
      addLog(`CHANCE: ${event.description}`, 'warning');
      
      setPlayers(prev => {
          const updatedPlayers = [...prev];
          const p = updatedPlayers[player.id];

          const isOuter = p.position < OUTER_BOARD_SIZE;
          const loopSize = isOuter ? OUTER_BOARD_SIZE : INNER_BOARD_SIZE;
          const loopStart = isOuter ? 0 : OUTER_BOARD_SIZE;

          if (event.effectType === 'MONEY') {
              p.money += event.value;
          } else if (event.effectType === 'MOVE') {
              let newPos = p.position + event.value;
              
              // Logic to stay within current loop bounds
              if (newPos < loopStart) newPos += loopSize;
              if (newPos >= loopStart + loopSize) newPos -= loopSize;
              
              p.position = newPos;
          }
          return updatedPlayers;
      });

      if (event.effectType === 'MONEY') {
         if (event.value > 0) playMoneyGain();
         else if (event.value < 0) playPayment();
      } else {
         playMove();
      }
      
      setPendingAction(null);
      endTurn();
  };

  const handleBankruptcy = (player: Player) => {
     addLog(`${player.name} has gone BANKRUPT!`, 'danger');
     playPayment(); 
     
     setPlayers(prev => {
         const updated = [...prev];
         updated[player.id].isBankrupt = true;
         return updated;
     });

     // Check game over next tick or use Ref
     setTimeout(() => {
         const activePlayers = playersRef.current.filter(p => !p.isBankrupt);
         if (activePlayers.length <= 1) {
            setPhase('GAME_OVER');
            addLog(`GAME OVER! ${activePlayers[0]?.name || 'Nobody'} Wins!`, 'success');
         } else {
            endTurn();
         }
     }, 100);
  };

  const endTurn = () => {
    setPhase('END_TURN');
    setTimeout(() => {
      let nextIndex = (currentPlayerIndex + 1) % playersRef.current.length;
      let checks = 0;
      // Skip bankrupt players
      while (playersRef.current[nextIndex].isBankrupt && checks < playersRef.current.length) {
          nextIndex = (nextIndex + 1) % playersRef.current.length;
          checks++;
      }
      setCurrentPlayerIndex(nextIndex);
      setPhase('WAITING');
    }, 1500);
  };

  // AI Turn Auto-Trigger
  useEffect(() => {
    if (phase === 'WAITING' && players[currentPlayerIndex] && players[currentPlayerIndex].type === PlayerType.AI) {
       // Small delay before AI rolls
       const timer = setTimeout(() => {
         rollDice();
       }, 1000);
       return () => clearTimeout(timer);
    }
  }, [phase, currentPlayerIndex, players, rollDice]);

  const getAvatarIcon = (avatar: string) => {
    const props = { size: 16 };
    switch(avatar) {
        case 'user': return <User {...props} />;
        case 'cpu': return <Cpu {...props} />;
        case 'bot': return <Bot {...props} />;
        case 'smile': return <Smile {...props} />;
        case 'crown': return <Crown {...props} />;
        case 'skull': return <Skull {...props} />;
        case 'rocket': return <Rocket {...props} />;
        case 'ghost': return <Ghost {...props} />;
        case 'gamepad': return <Gamepad2 {...props} />;
        case 'zap': return <Zap {...props} />;
        default: return <User {...props} />;
    }
  };
  
  const getTileRules = (tile: Tile) => {
      const isGoToJail = tile.id === 24; 
      
      if (isGoToJail) {
          return {
              en: "ARREST: Go directly to Jail and pay a $100 fine.",
              cn: "逮捕：直接进监狱并支付 $100 罚款。"
          };
      }
      
      switch (tile.type) {
          case TileType.START:
              return {
                  en: `Pass or land here to collect $${PASS_GO_MONEY}.`,
                  cn: `经过或停留此处可领取 $${PASS_GO_MONEY} 奖金。`
              };
          case TileType.PROPERTY:
              return {
                  en: `Price: $${tile.price}. Base Rent: $${tile.baseRent}. Buy this property to charge rent from opponents.`,
                  cn: `价格: $${tile.price}。基础租金: $${tile.baseRent}。购买此地块可向停留的对手收取租金。`
              };
          case TileType.SHOPPING:
              return {
                  en: "Shopping Mall. Spend a random amount (up to $100) if you land here.",
                  cn: "购物中心。停留此处将随机花费（最高 $100）。"
              };
          case TileType.AIRPORT:
              return {
                  en: "Airport. Fly to Central Hub. If you pass Central Hub in inner loop, you fly back here.",
                  cn: "机场。飞往中央枢纽。如果你在内环经过中央枢纽，将飞回此处。"
              };
          case TileType.BANK:
              return {
                  en: "Bank. Borrow money (10% interest) or repay debts.",
                  cn: "银行。借款（10% 利息）或偿还债务。"
              };
          case TileType.HOSPITAL:
              return {
                  en: "Hospital/Clinic. Rest for 1 or 3 turns.",
                  cn: "医院/诊所。休息 1 或 3 个回合。"
              };
          case TileType.JAIL:
              return {
                  en: "Just visiting.",
                  cn: "只是参观。"
              };
          case TileType.CHANCE:
              return {
                  en: "Draw a Chance card.",
                  cn: "抽取机会卡。"
              };
          case TileType.TAX:
              return {
                  en: `Pay income tax ($${tile.price}).`,
                  cn: `支付所得税 ($${tile.price})。`
              };
          case TileType.PARKING:
              return {
                  en: "Free Parking. Nothing happens.",
                  cn: "免费停车场。无事发生。"
              };
          default:
              return {
                  en: "Standard block.",
                  cn: "普通地块。"
              };
      }
  };

  // Stock Market Helpers
  const getSelectedStock = () => marketStocks.find(s => s.symbol === selectedStockSymbol) || marketStocks[0];
  
  // --- Render Setup Screen ---
  if (phase === 'SETUP') {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-neon-blue p-8 rounded-2xl max-w-2xl w-full shadow-[0_0_50px_rgba(0,243,255,0.1)]">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple mb-2">RICHMAN FUN</h1>
                    <p className="text-gray-400">Configure your neural interface</p>
                </div>

                <div className="space-y-8">
                    {/* Player Count Selection */}
                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => setPlayerCount(2)}
                            className={`px-6 py-3 rounded-lg border-2 transition-all ${playerCount === 2 ? 'border-neon-blue bg-neon-blue/10 text-white shadow-neon-blue' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                        >
                            2 Players (1v1 AI)
                        </button>
                        <button 
                             onClick={() => setPlayerCount(3)}
                             className={`px-6 py-3 rounded-lg border-2 transition-all ${playerCount === 3 ? 'border-neon-blue bg-neon-blue/10 text-white shadow-neon-blue' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                        >
                            3 Players (2v1 AI)
                        </button>
                    </div>

                    {/* Player 1 Config */}
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-neon-blue font-bold mb-3">Player 1 (Human)</h3>
                        <div className="flex gap-4 flex-col sm:flex-row">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">NAME</label>
                                <input 
                                    type="text" 
                                    value={p1Name} 
                                    onChange={(e) => setP1Name(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-neon-blue focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">AVATAR</label>
                                <div className="flex gap-2 flex-wrap max-w-[200px]">
                                    {AVAILABLE_AVATARS.map(av => (
                                        <button 
                                            key={av.id}
                                            onClick={() => setP1Avatar(av.id)}
                                            className={`p-2 rounded hover:bg-gray-700 transition-colors ${p1Avatar === av.id ? 'bg-neon-blue text-black' : 'bg-gray-900 text-gray-400'}`}
                                        >
                                            {av.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Player 2 Config (Only if 3 players) */}
                    {playerCount === 3 && (
                         <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <h3 className="text-neon-green font-bold mb-3">Player 2 (Human)</h3>
                            <div className="flex gap-4 flex-col sm:flex-row">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">NAME</label>
                                    <input 
                                        type="text" 
                                        value={p2Name} 
                                        onChange={(e) => setP2Name(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-neon-green focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">AVATAR</label>
                                    <div className="flex gap-2 flex-wrap max-w-[200px]">
                                        {AVAILABLE_AVATARS.map(av => (
                                            <button 
                                                key={av.id}
                                                onClick={() => setP2Avatar(av.id)}
                                                className={`p-2 rounded hover:bg-gray-700 transition-colors ${p2Avatar === av.id ? 'bg-neon-green text-black' : 'bg-gray-900 text-gray-400'}`}
                                            >
                                                {av.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={startGame}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-[1.02] transition-all"
                    >
                        INITIALIZE SYSTEM
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- Render Game ---

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col lg:flex-row overflow-hidden">
      
      {/* Sidebar / HUD */}
      <div className="w-full lg:w-80 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-4 z-20 shadow-xl">
        <div className="flex items-center justify-between mb-4">
           <h1 className="text-xl font-bold text-neon-blue">RICHMAN FUN</h1>
           <span className="text-xs bg-gray-800 px-2 py-1 rounded">Turn {Math.floor(logs.length / players.length)}</span>
        </div>

        {/* Player Stats */}
        <div className="space-y-2">
          {players.map(p => {
             const totalStockValue = Object.keys(p.portfolio).reduce((acc, symbol) => {
                 const stock = marketStocks.find(s => s.symbol === symbol);
                 return acc + (stock ? stock.price * p.portfolio[symbol].count : 0);
             }, 0);

             return (
             <div key={p.id} className={`p-3 rounded-lg border ${p.id === currentPlayerIndex ? 'border-neon-green bg-gray-800' : 'border-gray-700 bg-gray-800/50'} flex flex-col gap-1 transition-all`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-black font-bold relative`} style={{backgroundColor: p.color}}>
                            {getAvatarIcon(p.avatar)}
                            {p.isHospitalized && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">H</div>}
                        </div>
                        <div>
                            <div className="font-bold text-sm">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.type}</div>
                        </div>
                    </div>
                    <div className="text-neon-green font-mono flex items-center">
                        <DollarSign size={14} />
                        {p.money}
                    </div>
                </div>
                {/* Status Bars */}
                <div className="flex flex-wrap gap-2 mt-1">
                    {p.loan > 0 && (
                        <div className="flex items-center justify-between text-xs text-red-400 px-1 bg-red-900/20 rounded">
                            <span>DEBT: ${p.loan}</span>
                        </div>
                    )}
                    {totalStockValue > 0 && (
                        <div className="flex items-center justify-between text-xs text-blue-400 px-1 bg-blue-900/20 rounded">
                            <span>STOCKS: ${totalStockValue}</span>
                        </div>
                    )}
                </div>
                {p.isHospitalized && (
                    <div className="text-xs text-cyan-400 px-1 text-center bg-cyan-900/30 rounded">
                        Recovering: {p.hospitalTurns} turns
                    </div>
                )}
             </div>
          );})}
        </div>
        
        {/* Market Ticker (Simplified) */}
        <div className="bg-gray-800 p-2 rounded border border-gray-700">
             <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-1">
                <LineChart size={14} className="text-purple-400" />
                <span className="text-xs text-gray-300 font-bold">MARKET INDICES</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
                 {marketStocks.map(s => (
                     <div key={s.symbol} className="flex justify-between text-[10px]">
                         <span className="text-gray-400">{s.symbol}</span>
                         <span className={s.price >= s.previousPrice ? 'text-green-400' : 'text-red-400'}>${s.price}</span>
                     </div>
                 ))}
             </div>
        </div>

        <div className="flex-1 min-h-[200px]">
          <GameLogView logs={logs} />
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-950 p-2 lg:p-8 overflow-auto">
        <Board 
            tiles={tiles} 
            players={players} 
            onTileClick={(tile) => setSelectedTileInfo(tile)}
            dice={dice}
            isRolling={isRolling}
            onRollDice={rollDice}
            phase={phase}
            currentPlayer={currentPlayer}
        />

        {/* Tile Info Modal */}
        {selectedTileInfo && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedTileInfo(null)}>
                <div className="bg-gray-900 border border-gray-600 p-6 rounded-xl max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setSelectedTileInfo(null)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                    
                    <h2 className="text-2xl font-bold text-neon-blue mb-4">
                        {selectedTileInfo.name} 
                        <span className="text-lg text-gray-400 ml-2 font-sans">
                            ({TILE_NAME_TRANSLATIONS[selectedTileInfo.name] || ''})
                        </span>
                    </h2>
                    
                    {selectedTileInfo.ownerId !== undefined && selectedTileInfo.ownerId !== null && (
                        <div className="mb-4 p-2 bg-gray-800 rounded border border-gray-700 flex items-center gap-2">
                            <span className="text-gray-400 text-sm">Owned by:</span>
                            <span className="font-bold text-white">{players.find(p => p.id === selectedTileInfo.ownerId)?.name}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="bg-gray-800/50 p-3 rounded border-l-4 border-blue-500">
                            <h3 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">English Rule</h3>
                            <p className="text-white text-sm leading-relaxed">
                                {getTileRules(selectedTileInfo).en}
                            </p>
                        </div>
                        
                        <div className="bg-gray-800/50 p-3 rounded border-l-4 border-green-500">
                             <h3 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">中文规则</h3>
                            <p className="text-white text-sm leading-relaxed font-sans">
                                {getTileRules(selectedTileInfo).cn}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-xs text-gray-500">
                        Click outside to close
                    </div>
                </div>
            </div>
        )}

        {/* Detailed Stock Market Modal */}
        {showStockMarket && currentPlayer && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
                <div className="bg-gray-900 border border-gray-600 rounded-xl w-[800px] max-w-[95%] h-[500px] shadow-2xl flex overflow-hidden">
                    
                    {/* Left Sidebar (Tabs) */}
                    <div className="w-1/4 bg-gray-800 border-r border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-700">
                             <h2 className="font-bold text-neon-blue flex items-center gap-2">
                                 <Briefcase size={18} /> EXCHANGE
                             </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {marketStocks.map(stock => {
                                const isUp = stock.price >= stock.previousPrice;
                                return (
                                    <button
                                        key={stock.symbol}
                                        onClick={() => setSelectedStockSymbol(stock.symbol)}
                                        className={`w-full text-left p-4 border-b border-gray-700 transition-colors hover:bg-gray-700 ${selectedStockSymbol === stock.symbol ? 'bg-gray-700 border-l-4 border-l-neon-blue' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-white">{stock.symbol}</span>
                                            <span className={`font-mono text-sm ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                                ${stock.price}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">{stock.name}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Content (Details) */}
                    <div className="flex-1 bg-gray-900 p-6 flex flex-col">
                        {(() => {
                            const stock = getSelectedStock();
                            const userHolding = currentPlayer.portfolio[stock.symbol] || { count: 0, avgCost: 0 };
                            const isUp = stock.price >= stock.previousPrice;
                            
                            return (
                                <>
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                                {stock.name} <span className="text-gray-500 text-xl">({stock.symbol})</span>
                                            </h1>
                                            <div className={`flex items-center gap-2 text-xl font-mono mt-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                                {isUp ? <TrendingUp /> : <TrendingDown />}
                                                ${stock.price}
                                                <span className="text-sm text-gray-500 ml-2">Prev: ${stock.previousPrice}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-gray-400 text-sm">YOUR BALANCE</div>
                                            <div className="text-2xl font-bold text-neon-green">${currentPlayer.money}</div>
                                        </div>
                                    </div>

                                    {/* Chart Placeholder (Simple CSS bars) */}
                                    <div className="bg-gray-800/50 rounded-lg p-4 mb-6 h-32 flex items-end gap-1 border border-gray-700 relative">
                                         <div className="absolute top-2 left-2 text-xs text-gray-500">PRICE HISTORY (Last 10)</div>
                                         {stock.history.map((p, i) => {
                                             const max = Math.max(...stock.history, stock.price) * 1.1;
                                             const height = (p / max) * 100;
                                             return (
                                                 <div key={i} className="flex-1 bg-blue-500/30 hover:bg-blue-500/50 transition-all rounded-t relative group" style={{height: `${height}%`}}>
                                                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
                                                         ${p}
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                         {/* Current */}
                                         <div className={`flex-1 ${isUp ? 'bg-green-500' : 'bg-red-500'} rounded-t relative group`} style={{height: `${(stock.price / (Math.max(...stock.history, stock.price) * 1.1)) * 100}%`}}>
                                               <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black font-bold text-[10px] px-1 rounded">
                                                   ${stock.price}
                                               </div>
                                         </div>
                                    </div>

                                    {/* User Position */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-800 p-4 rounded-lg">
                                        <div>
                                            <div className="text-gray-400 text-xs">SHARES OWNED</div>
                                            <div className="text-xl font-bold text-white">{userHolding.count}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 text-xs">AVG BUY PRICE</div>
                                            <div className="text-xl font-bold text-white">${userHolding.avgCost}</div>
                                        </div>
                                    </div>

                                    {/* Trade Controls */}
                                    {currentPlayer.type === PlayerType.HUMAN ? (
                                        <div className="bg-gray-800 p-4 rounded-lg flex flex-col gap-4">
                                            <div className="flex items-center gap-4">
                                                <label className="text-gray-400 text-sm">Quantity:</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="100"
                                                    value={tradeQuantity}
                                                    onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded w-24 text-center focus:outline-none focus:border-neon-blue"
                                                />
                                                <span className="text-gray-500 text-sm">Total: ${tradeQuantity * stock.price}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button 
                                                    onClick={() => handleStockTransaction(stock.symbol, tradeQuantity, 'BUY')}
                                                    className="bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold flex items-center justify-center gap-2"
                                                >
                                                    BUY <span className="text-xs opacity-70">(-${tradeQuantity * stock.price})</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleStockTransaction(stock.symbol, tradeQuantity, 'SELL')}
                                                    disabled={userHolding.count < tradeQuantity}
                                                    className={`py-3 rounded font-bold flex items-center justify-center gap-2 ${userHolding.count < tradeQuantity ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                                                >
                                                    SELL <span className="text-xs opacity-70">(+${tradeQuantity * stock.price})</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-purple-400 animate-pulse font-mono border border-purple-500/30 rounded-lg">
                                            AI TRADING ALGORITHM RUNNING...
                                        </div>
                                    )}

                                    {/* Footer Close */}
                                    {currentPlayer.type === PlayerType.HUMAN && (
                                        <div className="mt-auto pt-4">
                                            <button 
                                                onClick={closeStockMarketAndMove}
                                                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2"
                                            >
                                                FINISH TRADING <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        )}

        {/* Modal Overlay for Decisions/Events */}
        {pendingAction && currentPlayer && currentPlayer.type === PlayerType.HUMAN && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
             <div className="bg-gray-900 border border-neon-blue p-6 rounded-xl max-w-md w-full shadow-neon-blue">
                
                {pendingAction.type === 'BUY_PROMPT' && pendingAction.tile && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2">Property Available</h2>
                    <div className="bg-gray-800 p-4 rounded mb-4 border-l-4" style={{borderColor: pendingAction.tile.colorGroup}}>
                      <h3 className="text-xl">{pendingAction.tile.name}</h3>
                      <p className="text-gray-400 mt-1">Price: <span className="text-white">${pendingAction.tile.price}</span></p>
                      <p className="text-gray-400">Rent: <span className="text-white">${pendingAction.tile.baseRent}</span></p>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleBuyProperty(currentPlayer, pendingAction.tile!)}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold"
                      >
                        BUY
                      </button>
                      <button 
                        onClick={endTurn}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold"
                      >
                        PASS
                      </button>
                    </div>
                  </>
                )}

                {pendingAction.type === 'CHANCE' && pendingAction.eventData && (
                   <>
                     <h2 className="text-2xl font-bold text-purple-400 mb-2">CHANCE EVENT</h2>
                     <p className="text-lg text-gray-200 mb-6 italic">"{pendingAction.eventData.description}"</p>
                     <div className="text-center mb-6 text-xl font-mono font-bold text-neon-blue">
                        {pendingAction.eventData.effectType === 'MONEY' && pendingAction.eventData.value > 0 && `+${pendingAction.eventData.value}`}
                        {pendingAction.eventData.effectType === 'MONEY' && pendingAction.eventData.value < 0 && `${pendingAction.eventData.value}`}
                        {pendingAction.eventData.effectType === 'MOVE' && `Move ${pendingAction.eventData.value} spaces`}
                     </div>
                     <button 
                        onClick={() => applyChanceEffect(currentPlayer, pendingAction.eventData)}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded font-bold"
                      >
                        ACCEPT FATE
                      </button>
                   </>
                )}

                {pendingAction.type === 'BANK' && (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <Building2 className="text-yellow-400" size={32} />
                            <h2 className="text-2xl font-bold text-white">{pendingAction.tile?.name || 'Bank'}</h2>
                        </div>
                        <p className="text-gray-300 mb-4">Current Balance: <span className="text-green-400">${currentPlayer.money}</span></p>
                        <p className="text-gray-300 mb-6">Current Debt: <span className="text-red-400">${currentPlayer.loan}</span></p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => handleBankAction('BORROW')}
                                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded font-bold flex justify-between px-4"
                            >
                                <span>Borrow $500</span>
                                <span className="text-xs opacity-75 self-center">Get $500, Owe $550</span>
                            </button>

                            <button 
                                onClick={() => handleBankAction('REPAY')}
                                disabled={currentPlayer.loan <= 0}
                                className={`w-full py-3 rounded font-bold flex justify-between px-4 ${currentPlayer.loan <= 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                            >
                                <span>Repay Debt</span>
                                <span className="text-xs opacity-75 self-center">Pay what you can</span>
                            </button>
                            
                            <button 
                                onClick={() => handleExitBank()}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold mt-2"
                            >
                                {remainingMoves > 0 ? "LEAVE & CONTINUE" : "LEAVE BANK"}
                            </button>
                        </div>
                    </>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
