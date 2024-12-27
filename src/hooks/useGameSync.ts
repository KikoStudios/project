import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { isGameExpired } from '../utils/gameUtils';

export const useGameSync = () => {
  const { state, dispatch } = useGame();
  const lastUpdateRef = useRef(state.lastStateUpdate);
  const params = new URLSearchParams(window.location.search);
  const gameCode = params.get('code')?.toUpperCase();
  const playerId = params.get('playerId');

  // Sync game state with localStorage
  useEffect(() => {
    // Initial sync
    const syncState = () => {
      if (!gameCode) return;

      const storedState = localStorage.getItem(`game_${gameCode}`);
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        if (parsedState.lastStateUpdate > lastUpdateRef.current) {
          dispatch({ 
            type: 'SET_INITIAL_STATE', 
            payload: parsedState 
          });
          lastUpdateRef.current = parsedState.lastStateUpdate;
        }
      }
    };

    // Initial sync
    syncState();

    // Set up interval for continuous sync
    const syncInterval = setInterval(() => {
      syncState();

      // Update activity timestamp without triggering a full state update
      const timestamp = Date.now();
      if (playerId) {
        dispatch({ 
          type: 'SET_PLAYER_ACTIVE',
          payload: { playerId, timestamp } 
        });
      }

      // Check for game expiration
      if (state.gameStatus === 'active' && isGameExpired(state.hostLastActive)) {
        dispatch({ type: 'CANCEL_GAME' });
        alert('Game cancelled due to host inactivity');
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [gameCode, playerId, dispatch]);

  // Save state changes to localStorage
  useEffect(() => {
    if (gameCode && state.lastStateUpdate > lastUpdateRef.current) {
      localStorage.setItem(`game_${gameCode}`, JSON.stringify(state));
      lastUpdateRef.current = state.lastStateUpdate;
    }
  }, [state, gameCode]);

  // Handle page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!playerId) return;

      if (document.hidden) {
        dispatch({ 
          type: 'SET_PLAYER_INACTIVE',
          payload: { playerId }
        });
      } else {
        dispatch({ 
          type: 'SET_PLAYER_ACTIVE',
          payload: { playerId }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dispatch, playerId]);

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (playerId) {
        dispatch({ 
          type: 'SET_PLAYER_INACTIVE',
          payload: { playerId }
        });
      }
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave the game?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dispatch, playerId]);
};