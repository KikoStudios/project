import { FC } from 'react';
import { useGame } from '../context/GameContext';
import { gameStateHelpers } from '../lib/supabase';

interface JoinGameProps {
  gameCode: string;
  playerName: string;
  onGameCodeChange: (code: string) => void;
  onPlayerNameChange: (name: string) => void;
  onCreateGame: () => void;
  onJoinGame: () => void;
}

export const JoinGame: FC<JoinGameProps> = ({
  gameCode,
  playerName,
  onGameCodeChange,
  onPlayerNameChange,
  onCreateGame,
  onJoinGame
}) => {
  const handleJoinGame = async () => {
    if (!gameCode || !playerName) {
      alert('Please enter both game code and name');
      return;
    }

    try {
      console.log('Attempting to join game:', gameCode);
      const game = await gameStateHelpers.getGame(gameCode);
      
      if (!game) {
        alert('Game not found');
        return;
      }

      const newPlayer = {
        id: crypto.randomUUID(),
        name: playerName,
        money: game.state.initialMoney || 1000,
        isFolded: false,
        currentBet: 0,
        loans: [],
        isActive: true,
        lastActive: Date.now(),
        isAllIn: false,
        lastBetAmount: 0,
        needsAction: false,
        hasEndedBetting: false
      };

      console.log('Adding player to game:', newPlayer);
      const success = await gameStateHelpers.addPlayer(gameCode, newPlayer);
      
      if (!success) {
        throw new Error('Failed to add player to game');
      }

      // Set up real-time subscription
      gameStateHelpers.subscribeToGame(gameCode, (updatedGame) => {
        if (updatedGame) {
          console.log('Game update received:', updatedGame);
          localStorage.setItem(`game_${gameCode}`, JSON.stringify(updatedGame.state));
        }
      });

      // Update URL with game code and player ID
      const url = new URL(window.location.href);
      url.searchParams.set('code', gameCode);
      url.searchParams.set('playerId', newPlayer.id);
      window.history.pushState({}, '', url);

      onJoinGame();
    } catch (error) {
      console.error('Error joining game:', error);
      alert('Failed to join game. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Game Code"
        value={gameCode}
        onChange={(e) => onGameCodeChange(e.target.value.toUpperCase())}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50"
      />
      <input
        type="text"
        placeholder="Your Name"
        value={playerName}
        onChange={(e) => onPlayerNameChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50"
      />
      <button
        onClick={handleJoinGame}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
      >
        Join Game
      </button>
      <button
        onClick={onCreateGame}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
      >
        Create New Game
      </button>
    </div>
  );
};