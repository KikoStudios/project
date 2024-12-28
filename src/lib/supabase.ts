import { createClient } from '@supabase/supabase-js';

// Replace these with your actual values from Supabase dashboard
const supabaseUrl = 'https://gienbzqhuvvwczossjgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZW5ienFodXZ2d2N6b3Nzamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTAyNzY2NjAsImV4cCI6MjAyNTg1MjY2MH0.868U5tmBy35CObDd6i5_jvd65tRKHwoSpuISoMMC8Rw';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
  }
});

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
  },

  async addPlayer(gameCode: string, player: any) {
    console.log('Adding player to game:', gameCode, player);
    try {
      const game = await this.getGame(gameCode);
      if (!game) {
        console.error('Game not found');
        return false;
      }

      // Check if player name already exists
      const existingPlayer = game.state.players?.find(
        (p: any) => p.name.toLowerCase() === player.name.toLowerCase()
      );

      if (existingPlayer) {
        console.error('Player name already exists');
        throw new Error('This name is already taken');
      }

      // Add the new player
      const updatedPlayers = [...(game.state.players || []), player];
      const updatedState = {
        ...game.state,
        players: updatedPlayers,
        lastStateUpdate: Date.now()
      };

      const { error } = await supabase
        .from('games')
        .update({
          state: updatedState,
          players: updatedPlayers,
          last_updated: new Date().toISOString()
        })
        .eq('game_code', gameCode.toUpperCase());

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully added player');
      return true;
    } catch (error) {
      console.error('Error adding player:', error);
      throw error;
    }
  }
}; 