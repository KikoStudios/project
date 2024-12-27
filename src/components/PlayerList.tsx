import { FC } from 'react';
import { Trash2 } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { Player } from '../types';

interface PlayerListProps {
  players: Player[];
}

export const PlayerList: FC<PlayerListProps> = ({ players }) => {
  const { dispatch } = useGame();

  const handleKickPlayer = (playerId: string) => {
    if (confirm('Are you sure you want to kick this player?')) {
      dispatch({ type: 'KICK_PLAYER', payload: { playerId } });
    }
  };

  return (
    <div className="space-y-2">
      {players.map(player => (
        <div 
          key={player.id}
          className="flex items-center justify-between bg-white/5 rounded-lg p-3"
        >
          <div>
            <div className="flex items-center">
              <span className="text-white font-medium">{player.name}</span>
            </div>
            <div className="text-sm text-white/60">${player.money}</div>
          </div>
          
          <button
            onClick={() => handleKickPlayer(player.id)}
            className="p-2 bg-red-500 rounded-lg hover:bg-red-600"
            title="Kick player"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
};