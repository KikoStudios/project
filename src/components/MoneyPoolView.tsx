import { FC } from 'react';
import { Coins } from 'lucide-react';
import { useGameSession } from '../hooks/useGameSession';
import { ROUNDS_PER_EPOCH } from '../utils/gameUtils';

export const MoneyPoolView: FC = () => {
  const state = useGameSession();
  const activePlayers = state.players.filter(p => !p.isFolded);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-teal-900 p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-xl text-center">
          <Coins className="w-24 h-24 text-green-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-2">Money Pool</h1>
          <div className="text-6xl font-bold text-green-400 mb-8">
            ${state.moneyPool}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-white/80 mb-8">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm">Active Players</div>
              <div className="text-2xl font-bold">{activePlayers.length}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm">Round</div>
              <div className="text-2xl font-bold">{state.currentRound}/{ROUNDS_PER_EPOCH}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Players</h2>
            {state.players.map(player => (
              <div 
                key={player.id} 
                className={`bg-white/5 rounded-lg p-4 flex justify-between items-center ${
                  player.isFolded ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <span className="text-white">{player.name}</span>
                  {player.isFolded && (
                    <span className="ml-2 text-xs bg-red-500/20 px-2 py-0.5 rounded text-red-300">
                      Folded
                    </span>
                  )}
                </div>
                <span className="text-green-400">${player.currentBet}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 