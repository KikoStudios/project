import { FC } from 'react';
import { useGame } from '../context/GameContext';

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

  const handleJoinGame = () => {
    if (!gameCode) {
      alert('Please enter game code');
      return;
    }

    // Try to get state from URL first
    const urlParams = new URLSearchParams(window.location.search);
    const encodedState = urlParams.get('state');
    let gameState;

    if (encodedState) {
      try {
        gameState = atob(encodedState);
      } catch (e) {
        console.error('Failed to decode state');
      }
    }

    // Fallback to localStorage
    if (!gameState) {
      gameState = localStorage.getItem(`game_${gameCode}`);
    }

    // If still no state, try to fetch from host
    if (!gameState) {
      // Create a unique channel for this game
      const channel = new BroadcastChannel(`game_${gameCode}`);
      
      // Request state from host
      channel.postMessage({ type: 'REQUEST_STATE' });
      
      // Set a timeout for response
      const timeout = setTimeout(() => {
        channel.close();
        alert('Game not found or host not responding');
      }, 3000);

      // Listen for response
      channel.onmessage = (event) => {
        if (event.data.type === 'STATE_RESPONSE') {
          clearTimeout(timeout);
          channel.close();
          gameState = event.data.state;
          localStorage.setItem(`game_${gameCode}`, gameState);
          continueJoin(gameState);
        }
      };

      return;
    }

    continueJoin(gameState);
  };

  const continueJoin = (gameState: string) => {
    try {
      const parsedState = JSON.parse(gameState);
      if (!gameCode) {
        alert('Please enter game code');
        return;
      }

      // Handle spectator join
      if (playerName === '##m-poll##') {
        const spectatorId = crypto.randomUUID();
        dispatch({
          type: 'ADD_SPECTATOR',
          payload: { spectatorId }
        });
        
        // Update URL with game code and state
        const url = new URL(window.location.href);
        url.searchParams.set('code', gameCode);
        url.searchParams.set('spectatorId', spectatorId);
        url.searchParams.set('gameState', gameState);
        window.history.pushState({}, '', url);
        
        window.location.reload();
        return;
      }

      if (!playerName) {
        alert('Please enter your name');
        return;
      }

      const nameExists = parsedState.players?.some(
        (p: Player) => p.name.toLowerCase() === playerName.toLowerCase()
      );

      if (nameExists) {
        alert('This name is already taken. Please choose a different name.');
        return;
      }

      const playerId = crypto.randomUUID();
      const newPlayer = {
        id: playerId,
        name: playerName,
        money: parsedState.initialMoney || state.initialMoney,
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

      // Update URL with all necessary parameters
      const url = new URL(window.location.href);
      url.searchParams.set('code', gameCode);
      url.searchParams.set('playerId', playerId);
      url.searchParams.set('gameState', gameState);
      window.history.pushState({}, '', url);

      dispatch({
        type: 'JOIN_GAME',
        payload: { player: newPlayer }
      });

      onJoinGame();
    } catch (e) {
      console.error('Failed to parse game state');
      alert('Invalid game state');
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