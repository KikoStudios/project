import { FC, useState } from 'react';
import { Trash2, RefreshCw, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { Player } from '../types';

interface PlayerListProps {
  players: Player[];
}

export const PlayerList: FC<PlayerListProps> = ({ players }) => {
  const { dispatch } = useGame();
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handleKickPlayer = (playerId: string) => {
    if (confirm('Are you sure you want to kick this player?')) {
      dispatch({ type: 'KICK_PLAYER', payload: { playerId } });
    }
  };

  const handleRecoverAccount = (playerId: string) => {
    setSelectedPlayer(players.find(p => p.id === playerId) || null);
    setShowRecoveryModal(true);
  };

  const handleConfirmRecovery = (targetPlayerId: string) => {
    if (selectedPlayer) {
      dispatch({
        type: 'RECOVER_ACCOUNT',
        payload: {
          sourcePlayerId: selectedPlayer.id,
          targetPlayerId
        }
      });
    }
    setShowRecoveryModal(false);
    setSelectedPlayer(null);
  };

  return (
    <>
      <div className="space-y-2">
        {players.map(player => (
          <div 
            key={player.id}
            className="flex items-center justify-between bg-white/5 rounded-lg p-3"
          >
            <div>
              <div className="flex items-center">
                <span className="text-white font-medium">{player.name}</span>
                {!player.isActive && (
                  <span className="ml-2 text-xs text-red-400">Disconnected</span>
                )}
              </div>
              <div className="text-sm text-white/60">${player.money}</div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleRecoverAccount(player.id)}
                className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600"
                title="Recover Account"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => handleKickPlayer(player.id)}
                className="p-2 bg-red-500 rounded-lg hover:bg-red-600"
                title="Kick player"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showRecoveryModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 w-full max-w-sm relative">
            <button 
              onClick={() => setShowRecoveryModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-bold text-white mb-4">
              Recover {selectedPlayer.name}'s Account (${selectedPlayer.money})
            </h3>
            <div className="space-y-4">
              {players
                .filter(p => p.id !== selectedPlayer.id)
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleConfirmRecovery(player.id)}
                    className="w-full bg-white/5 hover:bg-white/10 p-3 rounded-lg text-left"
                  >
                    <div className="text-white font-medium">{player.name}</div>
                    <div className="text-sm text-white/60">Current: ${player.money}</div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};