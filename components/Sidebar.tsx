import React from 'react';
import { Player, GameLog, Stock } from '../types';
import { DollarSign, LineChart } from 'lucide-react';
import { getAvatarIcon } from '../utils/gameAssets';
import GameLogView from './GameLog';

interface SidebarProps {
    players: Player[];
    currentPlayerIndex: number;
    marketStocks: Stock[];
    logs: GameLog[];
}

const Sidebar: React.FC<SidebarProps> = ({ players, currentPlayerIndex, marketStocks, logs }) => {
    return (
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
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-black font-bold relative`} style={{ backgroundColor: p.color }}>
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
                    );
                })}
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
    );
};

export default Sidebar;
