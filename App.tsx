import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Player, PlayerType, TileType, INITIAL_MONEY, PASS_GO_MONEY, BOARD_SIZE, Tile, GameLog } from './types';
import { INITIAL_TILES } from './constants';
import Board from './components/Board';
import Dice from './components/Dice';
import GameLogView from './components/GameLog';
import { getGeminiCommentary, generateChanceEvent } from './services/geminiService';
import { playDiceRoll, playMove, playPurchase, playPayment, playMoneyGain } from './services/audioService';
import { DollarSign, User, Cpu, Play, SkipForward, Building2, Bot, Smile, Crown, Skull, Rocket, Ghost, Gamepad2, Zap } from 'lucide-react';

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

const App: React.FC = () => {
  // Setup State
  const [playerCount, setPlayerCount] = useState<2 | 3>(2);
  const [p1Name, setP1Name] = useState('Human');
  const [p1Avatar, setP1Avatar] = useState('user');
  const [p2Name, setP2Name] = useState('Human 2');
  const [p2Avatar, setP2Avatar] = useState('smile');

  // Game State
  const [tiles, setTiles] = useState<Tile[]>(INITIAL_TILES);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  
  // Initial players state will be set after setup
  const [players, setPlayers] = useState<Player[]>([]);
  
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [phase, setPhase] = useState<GameState['gamePhase']>('SETUP');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [pendingAction, setPendingAction] = useState<{type: 'BUY_PROMPT' | 'CHANCE' | 'BANK', tile?: Tile, eventData?: any} | null>(null);

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
    if (phase !== 'WAITING') return;
    
    // Check Hospital Status
    if (currentPlayer.isHospitalized) {
        const updatedPlayers = [...players];
        updatedPlayers[currentPlayerIndex].hospitalTurns -= 1;
        addLog(`${currentPlayer.name} is recovering in hospital. (${updatedPlayers[currentPlayerIndex].hospitalTurns} turns left)`, 'warning');
        
        if (updatedPlayers[currentPlayerIndex].hospitalTurns <= 0) {
            updatedPlayers[currentPlayerIndex].isHospitalized = false;
            addLog(`${currentPlayer.name} has been discharged from the hospital!`, 'success');
        }
        setPlayers(updatedPlayers);
        endTurn();
        return;
    }

    playDiceRoll(); // Sound Effect
    setIsRolling(true);
    setPhase('ROLLING');
    
    // Sound effect simulation or just visual delay
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice([d1, d2]);
      setIsRolling(false);
      setPhase('MOVING');
      
      addLog(`${currentPlayer.name} rolled ${d1 + d2}`, 'info');
      movePlayer(d1 + d2);
    }, 1000);
  }, [phase, currentPlayer, players, currentPlayerIndex]);

  const movePlayer = async (steps: number) => {
    const p = { ...currentPlayer };
    let newPos = p.position;
    let passedGo = false;
    
    // Handling Go pass
    for(let i = 0; i < steps; i++) {
       newPos = (newPos + 1) % BOARD_SIZE;
       if (newPos === 0) {
         passedGo = true;
       }
    }
    
    const updatedPlayers = [...players];
    const updatedPlayer = updatedPlayers[currentPlayerIndex];

    if (passedGo) {
         updatedPlayer.money += PASS_GO_MONEY;
         playMoneyGain(); 
         addLog(`${p.name} passed Start! Collected $${PASS_GO_MONEY}`, 'success');
         
         // Loan Interest Logic
         if (updatedPlayer.loan > 0) {
             const interest = Math.ceil(updatedPlayer.loan * 0.1);
             updatedPlayer.loan += interest;
             addLog(`Loan Interest! Debt increased by $${interest} (Total: $${updatedPlayer.loan})`, 'danger');
             playPayment();
         }
    }
    
    // Update player pos in state
    updatedPlayer.position = newPos;
    setPlayers(updatedPlayers);
    playMove(); // Land Sound

    // Evaluate Tile
    setTimeout(() => {
      evaluateTile(updatedPlayers[currentPlayerIndex]);
    }, 500);
  };

  const evaluateTile = async (player: Player) => {
    const tile = tiles.find(t => t.id === player.position);
    if (!tile) return;

    addLog(`${player.name} landed on ${tile.name}`, 'info');

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
        const owner = players.find(pl => pl.id === tile.ownerId);
        const rent = calculateRent(tile);
        handlePayRent(player, owner!, rent);
      } else {
         addLog("Relaxing at own property.", 'info');
         endTurn();
      }
    } else if (tile.type === TileType.BANK) {
        setPhase('ACTION');
        if (player.type === PlayerType.HUMAN) {
            setPendingAction({ type: 'BANK', tile });
        } else {
            // AI Logic for Bank
            if (player.money < 200 && player.loan < 1000) {
                handleBankAction('BORROW');
            } else if (player.loan > 0 && player.money > player.loan + 300) {
                handleBankAction('REPAY');
            } else {
                addLog(`${player.name} leaves the bank.`, 'info');
                endTurn();
            }
        }
    } else if (tile.type === TileType.HOSPITAL) {
        const updatedPlayers = [...players];
        updatedPlayers[player.id].isHospitalized = true;
        updatedPlayers[player.id].hospitalTurns = 3;
        setPlayers(updatedPlayers);
        addLog(`${player.name} admitted to Hospital. Must rest for 3 turns.`, 'danger');
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
    const actualAmount = Math.min(payer.money, amount);
    
    playPayment(); // Sound Effect

    const updatedPlayers = [...players];
    updatedPlayers[payer.id].money -= actualAmount;
    updatedPlayers[owner.id].money += actualAmount;
    setPlayers(updatedPlayers);

    addLog(`${payer.name} paid $${actualAmount} rent to ${owner.name}.`, 'danger');
    if (payer.type === PlayerType.HUMAN && actualAmount > 50) {
        triggerAICommentary("High Rent Payment");
    }

    if (updatedPlayers[payer.id].money <= 0) {
       handleBankruptcy(payer);
    } else {
       endTurn();
    }
  };

  const handleBuyProperty = (player: Player, tile: Tile) => {
    const cost = tile.price || 0;
    playPurchase(); // Sound Effect

    const updatedPlayers = [...players];
    updatedPlayers[player.id].money -= cost;
    setPlayers(updatedPlayers);

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
      const player = players[currentPlayerIndex];
      const updatedPlayers = [...players];
      
      if (action === 'BORROW') {
          const loanAmount = 500;
          const interestInitial = 50;
          updatedPlayers[player.id].money += loanAmount;
          updatedPlayers[player.id].loan += (loanAmount + interestInitial);
          playMoneyGain();
          addLog(`${player.name} borrowed $${loanAmount} (Current Debt: $${updatedPlayers[player.id].loan})`, 'warning');
      } else {
          // Repay all or max possible
          const repayAmount = Math.min(player.money, player.loan);
          updatedPlayers[player.id].money -= repayAmount;
          updatedPlayers[player.id].loan -= repayAmount;
          playPayment();
          addLog(`${player.name} repaid $${repayAmount} to the Bank.`, 'success');
      }
      
      setPlayers(updatedPlayers);
      setPendingAction(null);
      endTurn();
  };

  const handleSpecialTile = async (player: Player, tile: Tile) => {
     if (tile.type === TileType.TAX) {
        const tax = tile.price || 100;
        playPayment(); // Sound Effect
        const updatedPlayers = [...players];
        updatedPlayers[player.id].money -= tax;
        setPlayers(updatedPlayers);
        addLog(`Paid $${tax} tax.`, 'danger');
        endTurn();
     } else if (tile.type === TileType.JAIL) {
        addLog("Just visiting jail.", 'info');
        endTurn();
     } else if (tile.id === 18) { // Go To Jail (Hardcoded index from constants)
        addLog("Sent to Jail!", 'danger');
        playPayment(); // Sound Effect
        const updatedPlayers = [...players];
        updatedPlayers[player.id].position = 6; // Jail index
        updatedPlayers[player.id].inJail = true;
        setPlayers(updatedPlayers);
        endTurn();
     } else if (tile.type === TileType.CHANCE) {
        setPhase('EVENT');
        addLog("Accessing Chance mainframe...", 'info');
        
        const event = await generateChanceEvent();
        
        setPendingAction({ type: 'CHANCE', eventData: event });
        
        // Auto apply for AI, wait for user ack for Human
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
      const updatedPlayers = [...players];
      
      if (event.effectType === 'MONEY') {
          updatedPlayers[player.id].money += event.value;
          if (event.value > 0) playMoneyGain();
          else if (event.value < 0) playPayment();
      } else if (event.effectType === 'MOVE') {
          playMove();
          let newPos = player.position + event.value;
          if (newPos < 0) newPos += BOARD_SIZE;
          if (newPos >= BOARD_SIZE) newPos -= BOARD_SIZE;
          updatedPlayers[player.id].position = newPos;
      }
      
      setPlayers(updatedPlayers);
      setPendingAction(null);
      endTurn();
  };

  const handleBankruptcy = (player: Player) => {
     addLog(`${player.name} has gone BANKRUPT!`, 'danger');
     playPayment(); // Sound Effect
     const updatedPlayers = [...players];
     updatedPlayers[player.id].isBankrupt = true;
     setPlayers(updatedPlayers);
     // Simple game over check
     const activePlayers = updatedPlayers.filter(p => !p.isBankrupt);
     if (activePlayers.length === 1) {
        setPhase('GAME_OVER');
        addLog(`GAME OVER! ${activePlayers[0].name} Wins!`, 'success');
     } else {
        endTurn();
     }
  };

  const endTurn = () => {
    setPhase('END_TURN');
    setTimeout(() => {
      let nextIndex = (currentPlayerIndex + 1) % players.length;
      // Simple infinite loop guard in case all bankrupt
      let checks = 0;
      while (players[nextIndex].isBankrupt && checks < players.length) {
          nextIndex = (nextIndex + 1) % players.length;
          checks++;
      }
      setCurrentPlayerIndex(nextIndex);
      setPhase('WAITING');
    }, 1500);
  };

  // AI Turn Auto-Trigger
  useEffect(() => {
    if (phase === 'WAITING' && players[currentPlayerIndex] && players[currentPlayerIndex].type === PlayerType.AI) {
       setTimeout(() => {
         rollDice();
       }, 1000);
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
          {players.map(p => (
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
                {p.loan > 0 && (
                    <div className="flex items-center justify-between text-xs text-red-400 px-1">
                        <span>DEBT:</span>
                        <span>-${p.loan}</span>
                    </div>
                )}
                {p.isHospitalized && (
                    <div className="text-xs text-cyan-400 px-1 text-center bg-cyan-900/30 rounded">
                        Recovering: {p.hospitalTurns} turns
                    </div>
                )}
             </div>
          ))}
        </div>

        <div className="flex-1 min-h-[200px]">
          <GameLogView logs={logs} />
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
           {phase === 'WAITING' && currentPlayer && currentPlayer.type === PlayerType.HUMAN && (
             <button 
               onClick={rollDice} 
               disabled={currentPlayer.isHospitalized && currentPlayer.hospitalTurns > 0 && false /* actually logic handled in rollDice */}
               className={`w-full ${currentPlayer.isHospitalized ? 'bg-gray-600' : 'bg-neon-blue hover:bg-blue-400'} text-black font-bold py-3 px-4 rounded flex items-center justify-center gap-2 shadow-neon-blue transition-all hover:scale-105`}
             >
               <Play size={18} /> {currentPlayer.isHospitalized ? `WAIT (${currentPlayer.hospitalTurns})` : 'ROLL DICE'}
             </button>
           )}
           
           {phase !== 'WAITING' && (
             <div className="text-center text-gray-400 text-sm animate-pulse">
               {phase === 'ROLLING' && "Rolling..."}
               {phase === 'MOVING' && "Moving..."}
               {phase === 'ACTION' && "Awaiting Action..."}
               {phase === 'EVENT' && "Processing Event..."}
               {phase === 'END_TURN' && "Ending Turn..."}
             </div>
           )}

           <Dice values={dice} rolling={isRolling} />
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-950 p-2 lg:p-8 overflow-auto">
        <Board tiles={tiles} players={players} />

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
                            <h2 className="text-2xl font-bold text-white">Neo Bank</h2>
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
                                disabled={currentPlayer.loan === 0}
                                className={`w-full ${currentPlayer.loan === 0 ? 'bg-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'} text-white py-3 rounded font-bold flex justify-between px-4`}
                            >
                                <span>Repay Loan</span>
                                <span className="text-xs opacity-75 self-center">Pays up to max</span>
                            </button>

                            <button 
                                onClick={endTurn}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold"
                            >
                                Leave Bank
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 text-center italic">Warning: Unpaid loans accumulate 10% interest each time you pass Start.</p>
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