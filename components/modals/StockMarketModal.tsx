
import React from 'react';
import { Stock, Player, PlayerType } from '../../types';
import { Briefcase, TrendingUp, TrendingDown } from 'lucide-react';

interface StockMarketModalProps {
    marketStocks: Stock[];
    currentPlayer: Player;
    onClose: () => void;
    onTransaction: (symbol: string, amount: number, type: 'BUY' | 'SELL') => void;
    selectedStockSymbol: string;
    setSelectedStockSymbol: (symbol: string) => void;
    tradeQuantity: number;
    setTradeQuantity: (qty: number) => void;
}

const StockMarketModal: React.FC<StockMarketModalProps> = ({
    marketStocks,
    currentPlayer,
    onClose,
    onTransaction,
    selectedStockSymbol,
    setSelectedStockSymbol,
    tradeQuantity,
    setTradeQuantity
}) => {
    const getSelectedStock = () => marketStocks.find(s => s.symbol === selectedStockSymbol) || marketStocks[0];
    const stock = getSelectedStock();
    const userHolding = currentPlayer.portfolio[stock.symbol] || { count: 0, avgCost: 0 };
    const isUp = stock.price >= stock.previousPrice;
    const isAI = currentPlayer.type === PlayerType.AI;

    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-600 rounded-xl w-[800px] max-w-[95%] h-[500px] shadow-2xl flex overflow-hidden relative">
                
                {/* AI Overlay */}
                {isAI && (
                    <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                         <div className="bg-black/80 border border-purple-500 px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(189,0,255,0.5)]">
                            <h2 className="text-2xl font-bold text-purple-400 animate-pulse">AI TRADING IN PROGRESS...</h2>
                            <p className="text-gray-400 text-center mt-2">Analyzing market trends</p>
                         </div>
                    </div>
                )}

                {/* Left Sidebar (Tabs) */}
                <div className="w-1/4 bg-gray-800 border-r border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="font-bold text-neon-blue flex items-center gap-2">
                            <Briefcase size={18} /> EXCHANGE
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {marketStocks.map(stock => {
                            const isStockUp = stock.price >= stock.previousPrice;
                            return (
                                <button
                                    key={stock.symbol}
                                    onClick={() => setSelectedStockSymbol(stock.symbol)}
                                    className={`w-full text-left p-4 border-b border-gray-700 transition-colors hover:bg-gray-700 ${selectedStockSymbol === stock.symbol ? 'bg-gray-700 border-l-4 border-l-neon-blue' : ''}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white">{stock.symbol}</span>
                                        <span className={`font-mono text-sm ${isStockUp ? 'text-green-400' : 'text-red-400'}`}>
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
                                <div key={i} className="flex-1 bg-blue-500/30 hover:bg-blue-500/50 transition-all rounded-t relative group" style={{ height: `${height}%` }}>
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
                                        ${p}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Current */}
                        <div className={`flex-1 ${isUp ? 'bg-green-500' : 'bg-red-500'} rounded-t relative group`} style={{ height: `${(stock.price / (Math.max(...stock.history, stock.price) * 1.1)) * 100}%` }}>
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
                    <div className={`bg-gray-800 p-4 rounded-lg flex flex-col gap-4 ${isAI ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                onClick={() => onTransaction(stock.symbol, tradeQuantity, 'BUY')}
                                className="bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold flex items-center justify-center gap-2"
                            >
                                BUY <span className="text-xs opacity-70">(-${tradeQuantity * stock.price})</span>
                            </button>
                            <button
                                onClick={() => onTransaction(stock.symbol, tradeQuantity, 'SELL')}
                                disabled={userHolding.count < tradeQuantity}
                                className={`py-3 rounded font-bold flex items-center justify-center gap-2 ${userHolding.count < tradeQuantity ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                            >
                                SELL <span className="text-xs opacity-70">(+${tradeQuantity * stock.price})</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer Close */}
                    {!isAI && (
                        <div className="mt-auto pt-4">
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold"
                            >
                                CLOSE MARKET
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockMarketModal;
