import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for game state
export const gameStateHelpers = {
  async getGame(gameCode: string) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('game_code', gameCode)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createGame(gameState: any) {
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
  },

  async updateGame(gameCode: string, gameState: any) {
    const { data, error } = await supabase
      .from('games')
      .update({
        state: gameState,
        last_updated: new Date().toISOString()
      })
      .eq('game_code', gameCode);
    
    if (error) throw error;
    return data;
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