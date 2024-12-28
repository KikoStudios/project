import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gienbzqhuvvwczossjgy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const gameStateHelpers = {
  async getGame(gameCode: string) {
    console.log('Fetching game:', gameCode); // Debug log
    try {
      const { data, error } = await supabase
        .from('games')
        .select('state')  // Only select the state column
        .eq('game_code', gameCode.toUpperCase())
        .single();
      
      if (error) {
        console.error('Supabase error:', error); // Debug log
        throw error;
      }
      
      console.log('Game data:', data); // Debug log
      return data?.state || null;
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  },

  async createGame(gameState: any) {
    console.log('Creating game:', gameState); // Debug log
    try {
      const { data, error } = await supabase
        .from('games')
        .insert([
          {
            game_code: gameState.gameCode.toUpperCase(),
            state: gameState,
            last_updated: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error); // Debug log
        throw error;
      }
      
      console.log('Created game:', data); // Debug log
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