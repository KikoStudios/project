import { useEffect } from 'react';
import { useGame } from '../context/GameContext';

export const useGameSession = () => {
  const { state, dispatch } = useGame();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameCode = params.get('code')?.toUpperCase();
    const playerId = params.get('playerId');
    
    // Handle tab close/unload
    const handleTabClose = () => {
      if (playerId) {
        dispatch({
          type: 'SET_PLAYER_INACTIVE',
          payload: { playerId }
        });
      }
    };

    // Set initial active state
    if (playerId) {
      dispatch({
        type: 'SET_PLAYER_ACTIVE',
        payload: { playerId }
      });
    }

    window.addEventListener('beforeunload', handleTabClose);
    window.addEventListener('unload', handleTabClose);

    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
      window.removeEventListener('unload', handleTabClose);
      handleTabClose();
    };
  }, []);

  return state;
}; 