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
  const { state, dispatch } = useGame();

  const handleJoinGame = async () => {
    if (!gameCode || !playerName) {
      alert('Please enter both game code and name');
      return;
    }

    try {
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

      // Add player to the game
      await gameStateHelpers.addPlayer(gameCode, newPlayer);

      // Subscribe to game updates
      const subscription = gameStateHelpers.subscribeToGame(gameCode, (updatedGame) => {
        if (updatedGame) {
          localStorage.setItem(`game_${gameCode}`, JSON.stringify(updatedGame.state));
        }
      });

      // Update URL and navigate
      const url = new URL(window.location.href);
      url.searchParams.set('code', gameCode);
      url.searchParams.set('playerId', newPlayer.id);
      window.history.pushState({}, '', url);

      onJoinGame();
    } catch (error) {
      console.error('Error joining game:', error);
      alert('Failed to join game');
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onCreateGame}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all"
      >
        Create Game
      </button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-transparent text-white/60">or</span>
        </div>
      </div>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Enter Game Code"
          value={gameCode}
          onChange={(e) => onGameCodeChange(e.target.value.toUpperCase())}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50"
          maxLength={6}
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
          disabled={!gameCode || !playerName}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Join Game
        </button>
      </div>
    </div>
  );
};