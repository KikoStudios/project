import { FC } from 'react';
import { useGame } from '../context/GameContext';
import { gameStateHelpers } from '../lib/supabase';

// Import initialState from GameContext
import { initialState } from '../context/GameContext';

interface CreateGameProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onCreateGame: () => void;
  onBack: () => void;
}

export const CreateGame: FC<CreateGameProps> = ({
  playerName,
  onPlayerNameChange,
  onCreateGame,
  onBack
}) => {
  // Get dispatch from useGame hook
  const { dispatch } = useGame();

  const handleCreateGame = async () => {
    if (!playerName) return;

    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newGameState = {
      ...initialState,
      gameCode,
      host: playerName,
      players: [],
      communityCards: [],
      gameStatus: 'waiting',
      lastStateUpdate: Date.now()
    };

    try {
      // Save to Supabase
      await gameStateHelpers.createGame(newGameState);
      
      // Save to localStorage
      localStorage.setItem(`game_${gameCode}`, JSON.stringify(newGameState));
      
      // Update URL and state
      const url = new URL(window.location.href);
      url.searchParams.set('code', gameCode);
      window.history.pushState({}, '', url);
      
      dispatch({ 
        type: 'SET_INITIAL_STATE', 
        payload: newGameState 
      });

      onCreateGame();
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Your Name (Host)"
        value={playerName}
        onChange={(e) => onPlayerNameChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50"
      />
      <button
        onClick={handleCreateGame}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
      >
        Create Game
      </button>
      <button
        onClick={onBack}
        className="w-full bg-white/5 text-white py-4 rounded-lg font-semibold hover:bg-white/10 transition-all"
      >
        Back
      </button>
    </div>
  );
};