import { useEffect } from 'react';
import { useGame } from '../context/GameContext';

export const useGameSession = () => {
  const { state, dispatch } = useGame();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameCode = params.get('code')?.toUpperCase();
    
    if (gameCode) {
      // Restore session on mount
      const savedState = localStorage.getItem(`game_${gameCode}`);
      if (savedState) {
        dispatch({ 
          type: 'SET_INITIAL_STATE', 
          payload: JSON.parse(savedState)
        });
      }
    }
  }, []);

  return state;
}; 