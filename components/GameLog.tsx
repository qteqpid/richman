import React, { useEffect, useRef } from 'react';
import { GameLog as GameLogType } from '../types';

interface GameLogProps {
  logs: GameLogType[];
}

const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-48 overflow-y-auto bg-neon-panel border border-gray-700 rounded p-2 text-sm font-mono">
      {logs.map((log) => {
        let color = 'text-gray-300';
        if (log.type === 'success') color = 'text-green-400';
        if (log.type === 'danger') color = 'text-red-400';
        if (log.type === 'ai') color = 'text-neon-pink italic';
        if (log.type === 'warning') color = 'text-yellow-400';

        return (
          <div key={log.id} className={`mb-1 ${color}`}>
            <span className="opacity-50 mr-2">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"})}]</span>
            {log.type === 'ai' && <span className="font-bold mr-1">AI:</span>}
            {log.message}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
};

export default GameLog;
