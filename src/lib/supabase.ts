import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gienbzqhuvvwczossjgy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const gameStateHelpers = {
  async getGame(gameCode: string) {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_code', gameCode.toUpperCase())
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
        .insert({
          game_code: gameState.gameCode.toUpperCase(),
          state: {
            ...gameState,
            players: [],
            communityCards: [],
            pot: 0,
            currentBet: 0,
            round: 0,
            gameStatus: 'waiting',
            lastStateUpdate: Date.now()
          },
          players: [],
          host: gameState.host,
          game_status: 'waiting',
          current_round: {
            bets: [],
            pot: 0,
            current_player: null,
            community_cards: []
          },
          betting_history: [],
          loans: [],
          last_updated: new Date().toISOString()
        })
        .select()
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
      const { error } = await supabase
        .from('games')
        .update({
          state: gameState,
          players: gameState.players || [],
          game_status: gameState.gameStatus,
          current_round: {
            bets: gameState.currentRound?.bets || [],
            pot: gameState.pot || 0,
            current_player: gameState.currentPlayer || null,
            community_cards: gameState.communityCards || []
          },
          betting_history: gameState.bettingHistory || [],
          loans: gameState.loans || [],
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

  async addBet(gameCode: string, playerId: string, amount: number) {
    const game = await this.getGame(gameCode);
    if (!game) return false;

    const currentRound = game.current_round;
    currentRound.bets.push({ playerId, amount, timestamp: Date.now() });
    currentRound.pot += amount;

    return this.updateGame(gameCode, {
      ...game.state,
      currentRound,
      lastStateUpdate: Date.now()
    });
  },

  async addLoan(gameCode: string, playerId: string, amount: number) {
    const game = await this.getGame(gameCode);
    if (!game) return false;

    const loans = game.loans || [];
    loans.push({
      playerId,
      amount,
      timestamp: Date.now(),
      repaid: false
    });

    return this.updateGame(gameCode, {
      ...game.state,
      loans,
      lastStateUpdate: Date.now()
    });
  },

  async updatePlayerStatus(gameCode: string, playerId: string, updates: any) {
    const game = await this.getGame(gameCode);
    if (!game) return false;

    const players = game.state.players.map(p => 
      p.id === playerId ? { ...p, ...updates } : p
    );

    return this.updateGame(gameCode, {
      ...game.state,
      players,
      lastStateUpdate: Date.now()
    });
  },

  subscribeToGame(gameCode: string, callback: (payload: any) => void) {
    return supabase
      .channel(`game:${gameCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `game_code=eq.${gameCode.toUpperCase()}`
        },
        (payload) => {
          console.log('Game update received:', payload);
          callback(payload.new);
        }
      )
      .subscribe();
  }
}; 