import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gienbzqhuvvwczossjgy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_current_key';

export const supabase = createClient(supabaseUrl, supabaseKey);

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
      throw error;
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