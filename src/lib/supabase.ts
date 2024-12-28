import { createClient } from '@supabase/supabase-js';

// Hardcode the values for now to test
const supabaseUrl = 'https://gienbzqhuvvwczossjgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZW5ienFodXZ2d2N6b3Nzamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNzY2NjAsImV4cCI6MjA1MDk1MjY2MH0.868U5tmBy35CObDd6i5_jvd65tRKHwoSpuISoMMC8Rw';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for game state
export const gameStateHelpers = {
  async getGame(gameCode: string) {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_code', gameCode)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  },

  async createGame(gameState: any) {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert([
          {
            game_code: gameState.gameCode,
            state: gameState,
            last_updated: new Date().toISOString()
          }
        ])
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating game:', error);
      return null;
    }
  },

  async updateGame(gameCode: string, gameState: any) {
    try {
      const { data, error } = await supabase
        .from('games')
        .update({
          state: gameState,
          last_updated: new Date().toISOString()
        })
        .eq('game_code', gameCode);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating game:', error);
      return null;
    }
  },

  // Subscribe to game changes
  subscribeToGame(gameCode: string, callback: (state: any) => void) {
    return supabase
      .channel(`game:${gameCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `game_code=eq.${gameCode}`
        },
        (payload) => {
          callback(payload.new.state);
        }
      )
      .subscribe();
  }
}; 