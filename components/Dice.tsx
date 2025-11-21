import React, { useEffect, useState } from 'react';

interface DiceProps {
  values: [number, number];
  rolling: boolean;
}

const Dice: React.FC<DiceProps> = ({ values, rolling }) => {
  const [displayValues, setDisplayValues] = useState(values);

  useEffect(() => {
    if (!rolling) {
      setDisplayValues(values);
    } else {
      const interval = setInterval(() => {
        setDisplayValues([
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1
        ]);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [rolling, values]);

  return (
    <div className="flex gap-4 justify-center py-4">
      <Die value={displayValues[0]} rolling={rolling} />
      <Die value={displayValues[1]} rolling={rolling} />
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
    return positions[val][index];
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
