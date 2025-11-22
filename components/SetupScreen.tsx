import React from 'react';
import { AVAILABLE_AVATARS } from '../utils/gameAssets';

interface SetupScreenProps {
    playerCount: 2 | 3;
    setPlayerCount: (count: 2 | 3) => void;
    p1Name: string;
    setP1Name: (name: string) => void;
    p1Avatar: string;
    setP1Avatar: (id: string) => void;
    p2Name: string;
    setP2Name: (name: string) => void;
    p2Avatar: string;
    setP2Avatar: (id: string) => void;
    onStartGame: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({
    playerCount, setPlayerCount,
    p1Name, setP1Name,
    p1Avatar, setP1Avatar,
    p2Name, setP2Name,
    p2Avatar, setP2Avatar,
    onStartGame
}) => {
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
                        onClick={onStartGame}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-[1.02] transition-all"
                    >
                        INITIALIZE SYSTEM
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupScreen;
