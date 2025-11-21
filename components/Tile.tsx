import React, { useMemo } from 'react';
import { Tile as TileType, TileType as EnumTileType, Player } from '../types';
import { Home, MapPin, AlertCircle, DollarSign, Lock, Zap, Car, Skull, HelpCircle, Database, Siren, Building2, Activity, User, Cpu, Bot, Smile, Crown, Rocket, Ghost, Gamepad2 } from 'lucide-react';

interface TileProps {
  tile: TileType;
  playersOnTile: Player[];
  isCurrentTarget?: boolean;
  owner?: Player;
}

const Tile: React.FC<TileProps> = ({ tile, playersOnTile, isCurrentTarget, owner }) => {
  
  const isGoToJail = tile.id === 18;

  const getIcon = () => {
    // Specific icons based on Name or Type
    if (tile.name.includes("Power") || tile.name.includes("Solar") || tile.name.includes("Fusion")) return <Zap className="text-yellow-400" size={16} />;
    if (tile.name.includes("Data") || tile.name.includes("Cyber")) return <Database className="text-blue-400" size={16} />;
    
    // Go To Jail handled separately now, but fallback just in case
    if (isGoToJail) return <Siren className="text-red-500 animate-pulse" size={16} />;

    switch (tile.type) {
      case EnumTileType.START: return <MapPin className="text-green-400" size={18} />;
      case EnumTileType.CHANCE: return <HelpCircle className="text-purple-400" size={16} />;
      case EnumTileType.JAIL: return <Lock className="text-red-400" size={16} />;
      case EnumTileType.TAX: return <DollarSign className="text-red-500" size={16} />;
      case EnumTileType.PARKING: return <Car className="text-yellow-400" size={18} />;
      case EnumTileType.BANK: return <Building2 className="text-yellow-300" size={18} />;
      case EnumTileType.HOSPITAL: return <Activity className="text-cyan-400" size={18} />;
      default: return null;
    }
  };

  const getPlayerAvatar = (avatarName: string) => {
    const size = 12;
    switch(avatarName) {
      case 'user': return <User size={size} />;
      case 'cpu': return <Cpu size={size} />;
      case 'bot': return <Bot size={size} />;
      case 'smile': return <Smile size={size} />;
      case 'crown': return <Crown size={size} />;
      case 'skull': return <Skull size={size} />;
      case 'rocket': return <Rocket size={size} />;
      case 'ghost': return <Ghost size={size} />;
      case 'gamepad': return <Gamepad2 size={size} />;
      case 'zap': return <Zap size={size} />;
      default: return <User size={size} />;
    }
  };

  // Procedural Background Generation
  const backgroundStyle = useMemo(() => {
    const baseColor = tile.colorGroup || '#333';

    if (isGoToJail) {
        return {
            background: `
                linear-gradient(90deg, rgba(255,0,0,0.1) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,255,0.1) 100%),
                repeating-linear-gradient(45deg, #1a0505, #1a0505 10px, #0a0a0a 10px, #0a0a0a 20px)
            `
        };
    }

    switch (tile.type) {
      case EnumTileType.START:
        return {
          background: `
            radial-gradient(circle at center, rgba(0, 255, 100, 0.2) 0%, transparent 70%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 100, 0.05) 2px, rgba(0, 255, 100, 0.05) 4px),
            linear-gradient(to bottom, #0a1a0a, #000)
          `
        };
      case EnumTileType.JAIL:
        return {
          background: `
            repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(255, 50, 50, 0.15) 15px, rgba(255, 50, 50, 0.15) 18px),
            linear-gradient(to bottom, #1a0505, #000)
          `,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
        };
      case EnumTileType.PARKING:
        return {
          background: `
            repeating-linear-gradient(-45deg, rgba(255, 200, 0, 0.08) 0px, rgba(255, 200, 0, 0.08) 10px, transparent 10px, transparent 20px),
            linear-gradient(to bottom, #1a1a05, #05050a)
          `
        };
      case EnumTileType.TAX:
        return {
          background: `
            radial-gradient(circle at center, rgba(255, 0, 0, 0.15), transparent 80%),
            repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.5) 4px, rgba(0,0,0,0.5) 6px),
            #2a0000
          `
        };
      case EnumTileType.CHANCE:
        return {
          background: `
            radial-gradient(circle at 50% 50%, rgba(189, 0, 255, 0.2), transparent 70%),
            repeating-radial-gradient(circle at 0 0, transparent 0, #0a0a12 4px),
            #080810
          `
        };
      case EnumTileType.BANK:
        return {
          background: `
            linear-gradient(135deg, #0a2a0a 0%, #1a1a00 100%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 215, 0, 0.05) 2px, rgba(255, 215, 0, 0.05) 4px)
          `,
          boxShadow: 'inset 0 0 15px rgba(255, 215, 0, 0.1)'
        };
      case EnumTileType.HOSPITAL:
        return {
          background: `
            linear-gradient(to bottom right, #0a151a, #000),
            radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 60%)
          `,
          border: '1px solid rgba(0, 255, 255, 0.2)'
        };
      case EnumTileType.PROPERTY:
        return {
          background: `
            linear-gradient(135deg, ${baseColor}33 0%, transparent 60%),
            linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%),
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
            #0a0a0f
          `,
          backgroundSize: '100% 100%, 100% 100%, 10px 10px, 10px 10px'
        };
      default:
        return { background: '#05050a' };
    }
  }, [tile.type, tile.colorGroup, isGoToJail]);

  // Dynamic Owner Styles
  const ownerBorderStyle = owner 
    ? { borderColor: owner.color, boxShadow: `0 0 10px ${owner.color}66` } 
    : {};
    
  const ownerOverlayStyle = owner
    ? { backgroundColor: owner.color, opacity: 0.1 }
    : {};

  const baseBorderClass = owner ? '' : (isGoToJail ? 'border-red-500/50' : 'border-gray-800');
  const glowClass = isCurrentTarget ? 'shadow-[0_0_20px_rgba(255,255,255,0.4)] z-20 scale-105 ring-1 ring-white' : '';
  
  return (
    <div 
      className={`relative w-full h-full flex flex-col border ${baseBorderClass} ${glowClass} transition-all duration-300 overflow-hidden group select-none`}
      style={{ ...backgroundStyle, ...ownerBorderStyle }}
    >
       {/* Dynamic Owner Overlay */}
       {owner && (
           <div className="absolute inset-0 pointer-events-none z-0" style={ownerOverlayStyle} />
       )}

      {/* Go To Jail Custom Background Graphic */}
      {isGoToJail && (
        <div className="absolute inset-0 z-0">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
                <defs>
                    <linearGradient id="bar-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00f3ff" stopOpacity="0" />
                        <stop offset="50%" stopColor="#00f3ff" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#00f3ff" stopOpacity="0" />
                    </linearGradient>
                    <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" style={{stroke:'rgba(255,0,0,0.2)', strokeWidth:1}} />
                    </pattern>
                </defs>
                
                {/* Background Hatch */}
                <rect width="100" height="100" fill="url(#diagonalHatch)" />

                {/* Vertical Laser Bars */}
                <rect x="20" y="0" width="2" height="100" fill="url(#bar-glow)" />
                <rect x="40" y="0" width="2" height="100" fill="url(#bar-glow)" />
                <rect x="60" y="0" width="2" height="100" fill="url(#bar-glow)" />
                <rect x="80" y="0" width="2" height="100" fill="url(#bar-glow)" />

                {/* Handcuffs Icon */}
                <g transform="translate(50, 45)" stroke="#e0e0e0" strokeWidth="2" fill="none">
                   <circle cx="-12" cy="0" r="10" />
                   <circle cx="12" cy="0" r="10" />
                   <path d="M-2 0 Q0 -8 2 0" strokeWidth="2" />
                </g>

                {/* Warning Lights Animation (simulated via CSS in component below, but drawing placeholders here) */}
                <circle cx="10" cy="10" r="2" fill="red" className="animate-ping" />
                <circle cx="90" cy="10" r="2" fill="blue" className="animate-ping delay-75" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 to-transparent pointer-events-none" />
        </div>
      )}
      
      {/* Hospital Custom Graphic Overlay */}
      {tile.type === EnumTileType.HOSPITAL && (
        <div className="absolute inset-0 z-[-1] opacity-20">
             <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M40 10 L60 10 L60 40 L90 40 L90 60 L60 60 L60 90 L40 90 L40 60 L10 60 L10 40 L40 40 Z" fill="cyan" />
             </svg>
        </div>
      )}

      {/* Color Bar for Properties */}
      {tile.type === EnumTileType.PROPERTY && (
        <div 
          className="h-1.5 w-full shadow-[0_0_10px_currentColor]" 
          style={{ backgroundColor: tile.colorGroup, color: tile.colorGroup, boxShadow: `0 0 8px ${tile.colorGroup}` }}
        ></div>
      )}
      
      <div className="flex-1 flex flex-col items-center justify-center p-1 text-center relative z-10">
        <div className="absolute inset-0 bg-black/20 z-[-1]"></div>

        {tile.type === EnumTileType.PROPERTY ? (
          <>
            <span className="font-bold truncate w-full text-[10px] sm:text-[11px] text-gray-100 drop-shadow-md leading-tight mb-0.5">{tile.name}</span>
            <span className="text-gray-300 text-[9px] font-mono bg-black/40 px-1 rounded border border-white/10">${tile.price}</span>
            <div className="flex gap-0.5 mt-1 min-h-[8px]">
              {tile.houseCount ? (
                 Array.from({length: tile.houseCount}).map((_, i) => (
                   <div key={i} className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_4px_#00ff00]"></div>
                 ))
              ) : null}
            </div>
          </>
        ) : (
          <>
             {/* Only show icon if NOT Go To Jail, because Go To Jail has full SVG background now */}
             {!isGoToJail && <div className="mb-1 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{getIcon()}</div>}
             
             <span className={`font-bold text-[10px] sm:text-xs text-white drop-shadow-md ${isGoToJail ? 'mt-8 bg-black/50 px-1 border border-red-500/30 rounded text-red-200' : ''}`}>
               {isGoToJail ? 'ARREST' : tile.name}
             </span>
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full flex justify-center gap-1 p-1 flex-wrap z-20">
        {playersOnTile.map(p => (
          <div 
            key={p.id} 
            className="w-5 h-5 rounded-full border border-white shadow-[0_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center text-[9px] font-bold text-black transform transition-transform hover:scale-125" 
            style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }}
          >
            {getPlayerAvatar(p.avatar)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tile;