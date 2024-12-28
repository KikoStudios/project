import { kv } from '@vercel/kv';

// Verify KV connection on init
const initKV = async () => {
  try {
    await kv.ping();
    console.log('KV connection successful');
  } catch (error) {
    console.error('KV connection failed:', error);
  }
};

initKV();

export const gameStateHelpers = {
  async getGame(gameCode: string) {
    try {
      const game = await kv.get(`game:${gameCode.toUpperCase()}`);
      console.log('Retrieved game:', game);
      return game;
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  },

  async createGame(gameState: any) {
    try {
      const gameCode = gameState.gameCode.toUpperCase();
      // Set game with 24-hour expiration
      await kv.set(`game:${gameCode}`, {
        gameCode,
        state: gameState,
        players: [],
        lastUpdated: Date.now()
      }, { ex: 86400 });
      
      return await this.getGame(gameCode);
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  },

  async updateGame(gameCode: string, gameState: any) {
    try {
      const game = await this.getGame(gameCode);
      if (!game) return false;

      await kv.set(`game:${gameCode.toUpperCase()}`, {
        ...game,
        state: gameState,
        lastUpdated: Date.now()
      }, { ex: 86400 }); // Refresh 24-hour expiration
      
      return true;
    } catch (error) {
      console.error('Error updating game:', error);
      return false;
    }
  },

  async addPlayer(gameCode: string, player: any) {
    try {
      const game = await this.getGame(gameCode);
      if (!game) return false;

      const players = [...(game.players || []), player];
      
      await kv.set(`game:${gameCode.toUpperCase()}`, {
        ...game,
        players,
        state: {
          ...game.state,
          players
        },
        lastUpdated: Date.now()
      }, { ex: 86400 });

      return true;
    } catch (error) {
      console.error('Error adding player:', error);
      return false;
    }
  },

  // Simple polling function instead of real-time subscription
  async pollGame(gameCode: string, callback: (game: any) => void) {
    const pollInterval = setInterval(async () => {
      const game = await this.getGame(gameCode);
      if (game) {
        callback(game);
      }
    }, 1000); // Poll every second

    return () => clearInterval(pollInterval);
  }
}; 