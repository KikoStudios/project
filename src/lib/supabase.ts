import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gienbzqhuvvwczossjgy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZW5ienFodXZ2d2N6b3Nzamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNzY2NjAsImV4cCI6MjA1MDk1MjY2MH0.868U5tmBy35CObDd6i5_jvd65tRKHwoSpuISoMMC8Rw';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const gameStateHelpers = {
  async getGame(gameCode: string) {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')  // Select all columns
        .eq('game_code', gameCode.toUpperCase())
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  },

  async createGame(gameState: any) {
    try {
      // First, check if game code already exists
      const existing = await this.getGame(gameState.gameCode);
      if (existing) {
        throw new Error('Game code already exists');
      }

      const { data, error } = await supabase
        .from('games')
        .insert({
          game_code: gameState.gameCode.toUpperCase(),
          state: gameState,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error; // Let the component handle the error
    }
  },

  async updateGame(gameCode: string, gameState: any) {
    try {
      const { error } = await supabase
        .from('games')
        .update({
          state: gameState,
          last_updated: new Date().toISOString()
        })
        .eq('game_code', gameCode.toUpperCase());
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating game:', error);
      return false;
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