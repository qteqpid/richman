
import React from 'react';
import { Tile, Player } from '../../types';
import { TILE_NAME_TRANSLATIONS, getTileRules } from '../../utils/gameAssets';
import { X, HelpCircle } from 'lucide-react';

interface ModalProps {
    onClose: () => void;
}

// --- BANK MODAL ---
interface BankModalProps extends ModalProps {
    tile: Tile;
    currentPlayer: Player;
    onAction: (action: 'BORROW' | 'REPAY') => void;
}

export const BankModal: React.FC<BankModalProps> = ({ tile, currentPlayer, onAction, onClose }) => (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-yellow-500 p-8 rounded-xl max-w-md w-full shadow-[0_0_50px_rgba(255,215,0,0.2)] text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">{tile.name || 'BANK'}</h2>
            <p className="text-gray-400 mb-6">Manage your finances. Interest rate: 5%.</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 p-3 rounded">
                    <div className="text-xs text-gray-500">CURRENT BALANCE</div>
                    <div className="text-xl font-bold text-neon-green">${currentPlayer.money}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                    <div className="text-xs text-gray-500">CURRENT DEBT</div>
                    <div className="text-xl font-bold text-red-400">${currentPlayer.loan}</div>
                </div>
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => onAction('BORROW')}
                    className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded"
                >
                    BORROW $500 <span className="text-xs block opacity-70">(+25 Interest)</span>
                </button>
                <button
                    onClick={() => onAction('REPAY')}
                    disabled={currentPlayer.loan <= 0}
                    className={`w-full py-3 font-bold rounded ${currentPlayer.loan <= 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                >
                    REPAY DEBT
                </button>
                <button
                    onClick={onClose}
                    className="w-full py-2 text-gray-400 hover:text-white text-sm"
                >
                    Leave
                </button>
            </div>
        </div>
    </div>
);

// --- BUY PROPERTY MODAL ---
interface BuyPropertyModalProps extends ModalProps {
    tile: Tile;
    onBuy: () => void;
}

export const BuyPropertyModal: React.FC<BuyPropertyModalProps> = ({ tile, onBuy, onClose }) => (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-neon-blue p-8 rounded-xl max-w-sm w-full shadow-[0_0_50px_rgba(0,243,255,0.2)] text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Buy Property?</h2>
            
            <div className="my-6">
                <div className="text-3xl font-bold text-neon-blue">{tile.name}</div>
                <div className="text-xl text-gray-400 font-sans mt-1">
                    {TILE_NAME_TRANSLATIONS[tile.name] ? `(${TILE_NAME_TRANSLATIONS[tile.name]})` : ''}
                </div>
            </div>

            <div className="flex justify-center gap-8 mb-6">
                <div>
                    <div className="text-xs text-gray-500">PRICE</div>
                    <div className="text-xl font-bold text-yellow-400">${tile.price}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500">RENT</div>
                    <div className="text-xl font-bold text-green-400">${tile.baseRent}</div>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBuy}
                    className="flex-1 py-3 bg-neon-blue hover:bg-blue-400 text-black font-bold rounded"
                >
                    BUY
                </button>
                <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded"
                >
                    PASS
                </button>
            </div>
        </div>
    </div>
);

// --- CHANCE MODAL ---
interface ChanceModalProps {
    eventData: { description: string };
    onAccept: () => void;
}

export const ChanceModal: React.FC<ChanceModalProps> = ({ eventData, onAccept }) => (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-purple-500 p-8 rounded-xl max-w-sm w-full shadow-[0_0_50px_rgba(189,0,255,0.2)] text-center transform scale-100 animate-in fade-in zoom-in duration-300">
            <HelpCircle size={48} className="mx-auto text-purple-500 mb-4" />
            <h2 className="text-2xl font-bold text-purple-400 mb-4">CHANCE EVENT</h2>
            <p className="text-lg text-white mb-8 font-mono leading-relaxed">
                {eventData.description}
            </p>
            <button
                onClick={onAccept}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_15px_#bd00ff]"
            >
                ACCEPT
            </button>
        </div>
    </div>
);

// --- TILE INFO MODAL ---
interface TileInfoModalProps {
    tile: Tile;
    players: Player[];
    onClose: () => void;
}

export const TileInfoModal: React.FC<TileInfoModalProps> = ({ tile, players, onClose }) => (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-gray-900 border border-gray-600 p-6 rounded-xl max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
                <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-neon-blue mb-4">
                {tile.name}
                <span className="text-lg text-gray-400 ml-2 font-sans">
                    ({TILE_NAME_TRANSLATIONS[tile.name] || ''})
                </span>
            </h2>

            {tile.ownerId !== undefined && tile.ownerId !== null && (
                <div className="mb-4 p-2 bg-gray-800 rounded border border-gray-700 flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Owned by:</span>
                    <span className="font-bold text-white">{players.find(p => p.id === tile.ownerId)?.name}</span>
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-gray-800/50 p-3 rounded border-l-4 border-blue-500">
                    <h3 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">English Rule</h3>
                    <p className="text-white text-sm leading-relaxed">
                        {getTileRules(tile).en}
                    </p>
                </div>

                <div className="bg-gray-800/50 p-3 rounded border-l-4 border-green-500">
                    <h3 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">中文规则</h3>
                    <p className="text-white text-sm leading-relaxed font-sans">
                        {getTileRules(tile).cn}
                    </p>
                </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
                Click outside to close
            </div>
        </div>
    </div>
);
