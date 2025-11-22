
import React, { useEffect, useState } from 'react';

interface DiceProps {
  value: number;
  rolling: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, rolling }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!rolling) {
      setDisplayValue(value);
    } else {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [rolling, value]);

  return (
    <div className="flex justify-center py-4">
      <Die value={displayValue} rolling={rolling} />
    </div>
  );
};

const Die: React.FC<{ value: number; rolling: boolean }> = ({ value, rolling }) => {
  const dots = Array.from({ length: value });
  
  // Mapping value to dot positions (simple grid logic)
  const getDotPosition = (val: number, index: number) => {
    const positions: Record<number, string[]> = {
      1: ['row-start-2 col-start-2'],
      2: ['row-start-1 col-start-1', 'row-start-3 col-start-3'],
      3: ['row-start-1 col-start-1', 'row-start-2 col-start-2', 'row-start-3 col-start-3'],
      4: ['row-start-1 col-start-1', 'row-start-1 col-start-3', 'row-start-3 col-start-1', 'row-start-3 col-start-3'],
      5: ['row-start-1 col-start-1', 'row-start-1 col-start-3', 'row-start-2 col-start-2', 'row-start-3 col-start-1', 'row-start-3 col-start-3'],
      6: ['row-start-1 col-start-1', 'row-start-1 col-start-3', 'row-start-2 col-start-1', 'row-start-2 col-start-3', 'row-start-3 col-start-1', 'row-start-3 col-start-3'],
    };
    return positions[val] ? positions[val][index] : '';
  };

  return (
    <div 
      className={`w-16 h-16 bg-white rounded-lg shadow-lg border-2 border-gray-300 grid grid-cols-3 grid-rows-3 p-2 gap-0.5 transition-transform duration-300 ${rolling ? 'animate-bounce rotate-12' : ''}`}
    >
      {dots.map((_, i) => (
        <div key={i} className={`w-3 h-3 bg-black rounded-full place-self-center ${getDotPosition(value, i)}`}></div>
      ))}
    </div>
  );
};

export default Dice;
