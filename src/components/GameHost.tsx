import { useState } from 'react';
import { Settings, Users, DollarSign } from 'lucide-react';
import { PlayerList } from './PlayerList';
import { GameControls } from './GameControls';
import { QRCodeDisplay } from './QRCodeDisplay';
import { SettingsModal } from './Settings';
import { useGame } from '../context/GameContext';
import { useGameSync } from '../hooks/useGameSync';
import { ROUNDS_PER_EPOCH } from '../utils/gameUtils';

export const GameHost = () => {
  const { state, dispatch } = useGame();
  const [showSettings, setShowSettings] = useState(false);
  
  useGameSync();

  const canStartNewRound = () => {
    const activePlayers = state.players.filter(p => !p.isFolded);
    if (activePlayers.length === 0) return false;
    
    if (state.currentRound === ROUNDS_PER_EPOCH) {
      return activePlayers.every(p => p.hasEndedBetting);
    }
    
    const allPlayersActed = activePlayers.every(p => 
      p.currentBet === state.highestBet || p.isAllIn || p.isFolded
    );
    return allPlayersActed;
  };

  const handleStartNewRound = () => {
    if (!canStartNewRound()) {
      alert('Cannot start new round until all players have called or folded');
      return;
    }

    if (state.currentRound >= ROUNDS_PER_EPOCH) {
      dispatch({ type: 'START_NEW_EPOCH' });
    } else {
      dispatch({ type: 'START_NEW_ROUND' });
    }
  };

  const handleSelectWinner = (playerId: string) => {
    dispatch({
      type: 'SELECT_WINNER',
      payload: { playerId }
    });
  };

  if (state.gameStatus === 'cancelled') {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Game Cancelled</h2>
          <p className="text-white/80">The game has been cancelled due to inactivity.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {state.showWinnerSelection ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Select Winner</h2>
            <div className="grid gap-4">
              {state.players.filter(p => !p.isFolded).map(player => (
                <button
                  key={player.id}
                  onClick={() => handleSelectWinner(player.id)}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg flex justify-between items-center"
                >
                  <span>{player.name}</span>
                  <span>${player.money}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 text-center text-white/60">
              Pool Amount: ${state.moneyPool}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">Poker Money Manager</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-white hover:text-gray-200"
                >
                  <Settings className="w-6 h-6" />
                </button>
                <span className="text-xl font-mono bg-white/20 px-4 py-2 rounded-lg text-white">
                  Game Code: {state.gameCode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PlayerList players={state.players} />
              <GameControls
                onStartNewRound={handleStartNewRound}
                currentRound={state.currentRound}
                currentEpoch={state.currentEpoch}
                highestBet={state.highestBet}
                canStartNewRound={canStartNewRound()}
              />
              <div className="flex justify-center items-start">
                <QRCodeDisplay gameCode={state.gameCode} />
              </div>
            </div>
          </div>
        )}
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};