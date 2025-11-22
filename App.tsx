
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, PlayerType, TileType, INITIAL_MONEY, PASS_GO_MONEY, OUTER_BOARD_SIZE, INNER_BOARD_SIZE, Tile, GameLog, Stock } from './types';
import { INITIAL_TILES, INITIAL_STOCKS } from './constants';
import Board from './components/Board';
import { getGeminiCommentary, generateChanceEvent } from './services/geminiService';
import { playDiceRoll, playMove, playPurchase, playPayment, playMoneyGain, speakText } from './services/audioService';

// Components
import SetupScreen from './components/SetupScreen';
import Sidebar from './components/Sidebar';
import StockMarketModal from './components/modals/StockMarketModal';
import { BankModal, BuyPropertyModal, ChanceModal, TileInfoModal } from './components/modals/GameModals';

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
  
  // Ref to track players/tiles state in async functions to avoid stale closures
  const playersRef = useRef<Player[]>([]);
  const tilesRef = useRef<Tile[]>(INITIAL_TILES);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);

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

    // Check Jail Status
    if (currentPlayer.inJail) {
        if (currentPlayer.jailTurns > 0) {
             setPlayers(prev => {
                const updated = [...prev];
                updated[currentPlayerIndex].jailTurns -= 1;
                return updated;
            });
            const turnsLeft = currentPlayer.jailTurns - 1;
            addLog(`${currentPlayer.name} is in Jail. (${turnsLeft} turns left)`, 'danger');
            if (turnsLeft <= 0) {
                 setPlayers(prev => {
                    const updated = [...prev];
                    updated[currentPlayerIndex].inJail = false;
                    return updated;
                });
                addLog(`${currentPlayer.name} released from Jail!`, 'success');
            }
            endTurn();
            return;
        } else {
             setPlayers(prev => {
                const updated = [...prev];
                updated[currentPlayerIndex].inJail = false;
                return updated;
            });
        }
    }

    playDiceRoll(); // Sound Effect
    isRollingRef.current = true;
    setIsRolling(true);
    setPhase('ROLLING');
    
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      
      // Stock Market Update Logic
      setTotalRolls(prev => prev + 1);

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
      
      setPhase('MOVING');
      addLog(`${currentPlayer.name} rolled ${d1}`, 'info');
      movePlayer(d1);
    }, 1000);
  }, [phase, currentPlayer, players, currentPlayerIndex, totalRolls]);

  const handleAIStockTrading = (diceResult: number) => {
      const ai = playersRef.current[currentPlayerIndex];
      
      // Safety check
      if (ai.type !== PlayerType.AI) return;

      // AI Strategy: Randomly pick a stock to analyze
      setTimeout(() => {
          try {
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
                  addLog(`${ai.name} holds positions.`, 'info');
              }
          } catch (e) {
              console.error("AI Stock Logic Error", e);
          }

          // Close market for AI automatically
          setTimeout(() => {
             closeStockMarketAndMove(diceResult);
          }, 2000); // Increased delay so humans can see AI window
      }, 500);
  };

  const closeStockMarketAndMove = (diceResultOverride?: number) => {
      setShowStockMarket(false);
      
      // If remaining moves exists, we are resuming a walk-by
      if (remainingMoves > 0) {
          addLog(`Resuming movement (${remainingMoves} steps)...`, 'info');
          setPhase('MOVING');
          const moves = remainingMoves;
          setRemainingMoves(0);
          movePlayer(moves);
          return;
      }

      // Use override if available (for AI closure context), otherwise state (for Human UI)
      const moves = diceResultOverride !== undefined ? diceResultOverride : pendingDiceResult;

      if (moves) {
          setPhase('MOVING');
          addLog(`${currentPlayer.name} proceeds with roll ${moves}`, 'info');
          movePlayer(moves);
          setPendingDiceResult(null);
      } else {
          // Fallback: If no remaining moves and no pending dice (e.g., landed on it), just end turn
          addLog("Market Closed.", 'info');
          endTurn();
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
    if (!steps || steps <= 0) {
        // Safety net for zero/null steps
        evaluateTile(overridePlayer || playersRef.current[currentPlayerIndex]);
        return;
    }

    const currentPlayerId = currentPlayerIndex;
    // Use local copy for calculations to avoid stale state during async loop.
    // If overridePlayer is provided (from Bank logic), use that as the source of truth.
    let p = overridePlayer ? { ...overridePlayer } : { ...playersRef.current[currentPlayerId] };
    let currentPos = p.position;

    for (let i = 0; i < steps; i++) {
        // Animation Delay - 300ms for better pace
        await new Promise(resolve => setTimeout(resolve, 300));

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
                    const interest = Math.ceil(p.loan * 0.05); // 5% interest
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

        // Check for Bank/ATM or Stock Market Passing Trigger (Walk-by rule)
        const currentTile = tilesRef.current.find(t => t.id === currentPos);
        const isBank = currentTile?.type === TileType.BANK;
        const isStockMarket = currentTile?.type === TileType.STOCK_MARKET;
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

        // If passing Stock Market, interrupt movement
        if (isStockMarket && stepsLeft > 0) {
             addLog(`${p.name} passes the Stock Exchange...`, 'info');
             setRemainingMoves(stepsLeft);
             setPhase('TRADING');
             setShowStockMarket(true);
             
             if (p.type === PlayerType.AI) {
                 // Trigger AI logic passing 0 as dice result (irrelevant for resume)
                 handleAIStockTrading(0);
             }
             return;
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

  const evaluateTile = async (player: Player) => {
    const tile = tilesRef.current.find(t => t.id === player.position);
    if (!tile) return;

    // Speak block name
    speakText(tile.name);

    addLog(`${player.name} landed on ${tile.name}`, 'info');

    // Check for Airport Teleportation
    if (tile.type === TileType.AIRPORT) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const targetName = "Central Hub";
        const targetTile = tilesRef.current.find(t => t.name === targetName);
        
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
  
  // --- Bankruptcy Prevention Helper ---
  const ensureSolvency = (player: Player, amount: number): Player => {
      // Shallow clone to modify
      let p = { ...player };
      let currentTiles = [...tilesRef.current];
      let soldProperties: string[] = [];
      
      // While player cannot afford the amount, sell properties
      while (p.money < amount) {
          // Find owned properties, sort by price (cheapest first to prolong the agony?)
          // Actually, prompt says "sold automatically one by one". 
          const ownedProperties = currentTiles.filter(t => t.ownerId === p.id).sort((a, b) => (a.price || 0) - (b.price || 0));
          
          if (ownedProperties.length === 0) {
              break; // No more assets to sell
          }

          const propertyToSell = ownedProperties[0];
          const sellValue = propertyToSell.price || 0;

          // Transaction
          p.money += sellValue;
          
          // Update Tile (Remove ownership)
          const tIdx = currentTiles.findIndex(t => t.id === propertyToSell.id);
          currentTiles[tIdx] = { ...currentTiles[tIdx], ownerId: null };
          
          soldProperties.push(propertyToSell.name);
      }

      if (soldProperties.length > 0) {
          setTiles(currentTiles); // Update React state for visual board
          addLog(`WARNING: ${p.name} auto-sold properties to cover debt: ${soldProperties.join(', ')}`, 'warning');
          playMoneyGain();
      }

      return p;
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
        
        if (owner?.inJail) {
             addLog(`${owner.name} is in Jail. Rent is waived!`, 'warning');
             endTurn();
             return;
        }

        const rent = calculateRent(tile);
        handlePayRent(player, owner!, rent);
      } else {
         addLog("Relaxing at own property.", 'info');
         endTurn();
      }
    } else if (tile.type === TileType.SHOPPING) {
        // Shopping Mall Logic: Pay random amount <= 100
        const cost = Math.floor(Math.random() * 100) + 1;
        
        // Check solvency before deduction
        const solventPlayer = ensureSolvency(player, cost);
        
        setPlayers(prev => {
            const updated = [...prev];
            updated[player.id] = solventPlayer;
            updated[player.id].money -= cost;
            return updated;
        });
        
        playPayment();
        addLog(`${player.name} went shopping and spent $${cost}.`, 'warning');
        
        if (solventPlayer.money - cost < 0) {
            handleBankruptcy(solventPlayer);
        } else {
            endTurn();
        }

    } else if (tile.type === TileType.BANK) {
        setPhase('ACTION');
        if (player.type === PlayerType.HUMAN) {
            setPendingAction({ type: 'BANK', tile });
        } else {
            // AI Logic for Bank (Landing)
            handleAIBankLogic(player);
        }
    } else if (tile.type === TileType.STOCK_MARKET) {
        setPhase('TRADING');
        setShowStockMarket(true);
        if (player.type === PlayerType.AI) {
            handleAIStockTrading(0);
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
    // 1. Ensure Solvency (Auto-sell properties)
    const solventPayer = ensureSolvency(payer, amount);
    
    // 2. Determine actual payment amount
    // If still bankrupt after selling, pay whatever is left (if positive)
    const actualAmount = Math.max(0, Math.min(solventPayer.money, amount));
    
    setPlayers(prev => {
        const updated = [...prev];
        
        // Update payer with the state from ensureSolvency
        const p = { ...solventPayer }; 
        const o = { ...updated[owner.id] };
        
        p.money -= actualAmount;
        o.money += actualAmount;
        
        updated[p.id] = p;
        updated[o.id] = o;
        return updated;
    });

    playPayment(); // Sound Effect

    addLog(`${solventPayer.name} paid $${actualAmount} rent to ${owner.name}.`, 'danger');
    if (solventPayer.type === PlayerType.HUMAN && actualAmount > 50) {
        triggerAICommentary("High Rent Payment");
    }

    // Check bankruptcy
    // We use solventPayer state before deduction for logic, but actual state is updated
    if (solventPayer.money - actualAmount < 0) {
       handleBankruptcy(solventPayer);
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

    // Update tiles logic
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
          const interestInitial = 25; // 5% of 500
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
          
          // Reset phase to MOVING explicitly so UI doesn't say "ACTION REQUIRED"
          setPhase('MOVING');
          
          // CRITICAL: Resume movePlayer with the UPDATED player state
          movePlayer(moves, p);
      } else {
          endTurn();
      }
  };

  const handleSpecialTile = async (player: Player, tile: Tile) => {
     if (tile.type === TileType.TAX) {
        const tax = tile.price || 100;
        
        const solventPlayer = ensureSolvency(player, tax);

        playPayment(); 
        setPlayers(prev => {
            const updated = [...prev];
            updated[player.id] = solventPlayer;
            updated[player.id].money -= tax;
            return updated;
        });
        
        addLog(`Paid $${tax} tax.`, 'danger');
        
        if (solventPlayer.money - tax < 0) {
            handleBankruptcy(solventPlayer);
        } else {
            endTurn();
        }

     } else if (tile.type === TileType.JAIL) {
        addLog("Just visiting jail.", 'info');
        endTurn();
     } else if (tile.id === 24) { // Go To Jail (New ID)
        playPayment(); 
        const fine = 100;
        
        // Try to pay fine
        const solventPlayer = ensureSolvency(player, fine);

        addLog(`ARRESTED! Sent to Jail for 2 turns. Fined $${fine}.`, 'danger');
        
        setPlayers(prev => {
            const updated = [...prev];
            const p = updated[player.id];
            p.position = 8; // Jail index
            p.inJail = true;
            p.jailTurns = 2; // Set 2 turn wait
            p.money = solventPlayer.money - fine; // Use solvent money state
            return updated;
        });
        
        if (solventPlayer.money - fine < 0) {
            handleBankruptcy(solventPlayer);
        } else {
            endTurn();
        }

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
      
      // Check solvency if losing money
      let solventPlayer = { ...player };
      if (event.effectType === 'MONEY' && event.value < 0) {
           solventPlayer = ensureSolvency(player, Math.abs(event.value));
      }

      setPlayers(prev => {
          const updatedPlayers = [...prev];
          // Use solvent player state if modified
          const p = updatedPlayers[player.id];
          if (event.effectType === 'MONEY' && event.value < 0) {
              p.money = solventPlayer.money; 
          }

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
         else if (event.value < 0) {
             playPayment();
             if (solventPlayer.money + event.value < 0) {
                 handleBankruptcy(solventPlayer);
                 return;
             }
         }
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
  
  // --- Render Setup Screen ---
  if (phase === 'SETUP') {
      return (
        <SetupScreen 
            playerCount={playerCount} setPlayerCount={setPlayerCount}
            p1Name={p1Name} setP1Name={setP1Name}
            p1Avatar={p1Avatar} setP1Avatar={setP1Avatar}
            p2Name={p2Name} setP2Name={setP2Name}
            p2Avatar={p2Avatar} setP2Avatar={setP2Avatar}
            onStartGame={startGame}
        />
      );
  }

  // --- Render Game ---
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col lg:flex-row overflow-hidden">
      
      {/* Sidebar / HUD */}
      <Sidebar 
        players={players} 
        currentPlayerIndex={currentPlayerIndex} 
        marketStocks={marketStocks} 
        logs={logs} 
      />

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
            <TileInfoModal 
                tile={selectedTileInfo} 
                players={players} 
                onClose={() => setSelectedTileInfo(null)} 
            />
        )}

        {/* Detailed Stock Market Modal */}
        {showStockMarket && currentPlayer && (
            <StockMarketModal 
                marketStocks={marketStocks}
                currentPlayer={currentPlayer}
                onClose={() => closeStockMarketAndMove()}
                onTransaction={handleStockTransaction}
                selectedStockSymbol={selectedStockSymbol}
                setSelectedStockSymbol={setSelectedStockSymbol}
                tradeQuantity={tradeQuantity}
                setTradeQuantity={setTradeQuantity}
            />
        )}

        {/* Bank Action Modal */}
        {pendingAction && pendingAction.type === 'BANK' && pendingAction.tile && (
            <BankModal 
                tile={pendingAction.tile}
                currentPlayer={currentPlayer}
                onAction={handleBankAction}
                onClose={() => handleExitBank()}
            />
        )}

        {/* Buy Property Prompt */}
        {pendingAction && pendingAction.type === 'BUY_PROMPT' && pendingAction.tile && (
            <BuyPropertyModal 
                tile={pendingAction.tile}
                onBuy={() => handleBuyProperty(currentPlayer, pendingAction.tile!)}
                onClose={() => { setPendingAction(null); endTurn(); }}
            />
        )}

        {/* Chance Card Modal */}
        {pendingAction && pendingAction.type === 'CHANCE' && pendingAction.eventData && (
             <ChanceModal 
                eventData={pendingAction.eventData}
                onAccept={() => applyChanceEffect(currentPlayer, pendingAction.eventData)}
             />
        )}
      </div>
    </div>
  );
};

export default App;
