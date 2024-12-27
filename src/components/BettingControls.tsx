import { FC, useState, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

interface BettingControlsProps {
  minBet: number;
  maxBet: number;
  onBet: (amount: number) => void;
  onFold: () => void;
}

export const BettingControls: FC<BettingControlsProps> = ({
  minBet,
  maxBet,
  onBet,
  onFold
}) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const isIncrementing = useRef(false);

  const adjustBet = (increment: number) => {
    setBetAmount(prev => {
      const newAmount = Math.min(Math.max(minBet, prev + increment), maxBet);
      return Math.round(newAmount / 10) * 10; // Round to nearest 10
    });
  };

  const handleTouchStart = (increment: boolean) => {
    isIncrementing.current = increment;
    longPressTimer.current = setTimeout(() => {
      const interval = setInterval(() => {
        adjustBet(increment ? 100 : -100);
      }, 100);
      longPressTimer.current = interval;
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
        <button
          className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white"
          onTouchStart={() => handleTouchStart(false)}
          onTouchEnd={handleTouchEnd}
          onClick={() => adjustBet(-10)}
        >
          <Minus size={24} />
        </button>

        <div className="text-center">
          <div className="text-3xl font-bold text-white">${betAmount}</div>
          <div className="text-xs text-white/60">Min: ${minBet}</div>
        </div>

        <button
          className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white"
          onTouchStart={() => handleTouchStart(true)}
          onTouchEnd={handleTouchEnd}
          onClick={() => adjustBet(10)}
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onBet(betAmount)}
          disabled={betAmount < minBet}
          className="bg-green-500 text-white py-4 rounded-lg text-lg font-semibold disabled:opacity-50"
        >
          Bet ${betAmount}
        </button>
        <button
          onClick={onFold}
          className="bg-red-500 text-white py-4 rounded-lg text-lg font-semibold"
        >
          Fold
        </button>
      </div>
    </div>
  );
};