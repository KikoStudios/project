import { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { GameHost } from './components/GameHost';
import { PlayerView } from './components/PlayerView';
import { JoinGame } from './components/JoinGame';
import { CreateGame } from './components/CreateGame';
import { MoneyPoolView } from './components/MoneyPoolView';
import { useGame } from './context/GameContext';

export function App() {
  const { dispatch } = useGame();
  const [view, setView] = useState<'join' | 'create' | 'host' | 'player' | 'spectator'>('join');
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code');
    const spectatorId = params.get('spectatorId');
    const playerId = params.get('playerId');
    
    if (codeFromUrl) {
      setGameCode(codeFromUrl.toUpperCase());
      if (spectatorId) {
        setView('spectator');
      } else if (playerId) {
        setView('player');
      }
    }
  }, []);

  if (view === 'host') return <GameHost />;
  if (view === 'player') return <PlayerView />;
  if (view === 'spectator') return <MoneyPoolView />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Coins className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Poker Money Manager</h1>
        </div>

        {view === 'join' && (
          <JoinGame
            gameCode={gameCode}
            playerName={playerName}
            onGameCodeChange={setGameCode}
            onPlayerNameChange={setPlayerName}
            onCreateGame={() => setView('create')}
            onJoinGame={() => setView('player')}
          />
        )}

        {view === 'create' && (
          <CreateGame
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            onCreateGame={() => setView('host')}
            onBack={() => setView('join')}
          />
        )}
      </div>
    </div>
  );
}