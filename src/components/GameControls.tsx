import { FC } from 'react';
import { DollarSign, PlayCircle } from 'lucide-react';

interface GameControlsProps {
  onStartNewRound: () => void;
  currentRound: number;
  highestBet: number;
  canStartNewRound: boolean;
}

export const GameControls: FC<GameControlsProps> = ({
  onStartNewRound,
  currentRound,
  highestBet,
  canStartNewRound
}) => {
  return (
    <div className="bg-white/5 p-4 rounded-lg">
      <div className="flex items-center mb-4">
        <DollarSign className="w-5 h-5 text-white mr-2" />
        <h2 className="text-xl text-white">Game Controls</h2>
      </div>

      <div className="mb-4 space-y-2">
        <div className="text-white">
          Current Round: <span className="font-bold">{currentRound}</span>
        </div>
        <div className="text-white">
          Highest Bet: <span className="font-bold text-green-400">${highestBet}</span>
        </div>
      </div>

      <button
        onClick={onStartNewRound}
        disabled={!canStartNewRound}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <PlayCircle className="w-5 h-5 mr-2" />
        {canStartNewRound ? 'Start New Round' : 'Waiting for Players'}
      </button>
    </div>
  );
};