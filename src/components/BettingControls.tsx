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
  const pressStartTime = useRef<number>(0);
  const longPressTimer = useRef<ReturnType<typeof setInterval>>();
  const holdDuration = useRef<number>(0);

  const adjustBet = (increment: number) => {
    setBetAmount(prev => {
      // Calculate how many full seconds were held
      const secondsHeld = Math.floor(holdDuration.current / 1000);
      // If held for less than a second, add/subtract 10
      // If held for 1+ seconds, add/subtract 100 for each second
      const amount = secondsHeld > 0 ? secondsHeld * 100 : 10;
      const newAmount = Math.min(Math.max(minBet, prev + (increment ? amount : -amount)), maxBet);
      return Math.round(newAmount / 10) * 10;
    });
  };

  const handlePressStart = () => {
    pressStartTime.current = Date.now();
    holdDuration.current = 0;

    // Start tracking hold duration
    longPressTimer.current = setInterval(() => {
      holdDuration.current = Date.now() - pressStartTime.current;
    }, 100);
  };

  const handlePressEnd = (increment: boolean) => {
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current);
      longPressTimer.current = undefined;
    }
    // Only adjust bet if we actually held the button
    if (pressStartTime.current > 0) {
      adjustBet(increment);
      pressStartTime.current = 0;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
        <button
          className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white"
          onMouseDown={() => handlePressStart()}
          onMouseUp={() => handlePressEnd(false)}
          onMouseLeave={() => handlePressEnd(false)}
          onTouchStart={() => handlePressStart()}
          onTouchEnd={() => handlePressEnd(false)}
        >
          <Minus size={24} />
        </button>

        <div className="text-center">
          <div className="text-3xl font-bold text-white">${betAmount}</div>
          <div className="text-xs text-white/60">Min: ${minBet}</div>
        </div>

        <button
          className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white"
          onMouseDown={() => handlePressStart()}
          onMouseUp={() => handlePressEnd(true)}
          onMouseLeave={() => handlePressEnd(true)}
          onTouchStart={() => handlePressStart()}
          onTouchEnd={() => handlePressEnd(true)}
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