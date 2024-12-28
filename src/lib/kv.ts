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
      const initialState = {
        ...gameState,
        players: [],
        communityCards: [],
        pot: 0,
        currentBet: 0,
        round: 0,
        bets: [],
        loans: [],
        lastStateUpdate: Date.now(),
        gameStatus: 'waiting'
      };

      await kv.set(`game:${gameCode}`, {
        gameCode,
        state: initialState,
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
        state: {
          ...gameState,
          lastStateUpdate: Date.now()
        },
        lastUpdated: Date.now()
      }, { ex: 86400 });
      
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

      const players = [...(game.state.players || []), player];
      
      await kv.set(`game:${gameCode.toUpperCase()}`, {
        ...game,
        state: {
          ...game.state,
          players,
          lastStateUpdate: Date.now()
        },
        lastUpdated: Date.now()
      }, { ex: 86400 });

      return true;
    } catch (error) {
      console.error('Error adding player:', error);
      return false;
    }
  },

  async placeBet(gameCode: string, playerId: string, amount: number) {
    try {
      const game = await this.getGame(gameCode);
      if (!game) return false;

      const updatedState = {
        ...game.state,
        pot: (game.state.pot || 0) + amount,
        bets: [...(game.state.bets || []), { playerId, amount, timestamp: Date.now() }],
        players: game.state.players.map((p: any) => 
          p.id === playerId 
            ? { ...p, money: p.money - amount, lastBetAmount: amount }
            : p
        ),
        lastStateUpdate: Date.now()
      };

      await this.updateGame(gameCode, updatedState);
      return true;
    } catch (error) {
      console.error('Error placing bet:', error);
      return false;
    }
  },

  async takeLoan(gameCode: string, playerId: string, amount: number) {
    try {
      const game = await this.getGame(gameCode);
      if (!game) return false;

      const updatedState = {
        ...game.state,
        loans: [...(game.state.loans || []), { playerId, amount, timestamp: Date.now() }],
        players: game.state.players.map((p: any) => 
          p.id === playerId 
            ? { ...p, money: p.money + amount, loans: [...(p.loans || []), amount] }
            : p
        ),
        lastStateUpdate: Date.now()
      };

      await this.updateGame(gameCode, updatedState);
      return true;
    } catch (error) {
      console.error('Error taking loan:', error);
      return false;
    }
  },

  async kickPlayer(gameCode: string, playerId: string) {
    try {
      const game = await this.getGame(gameCode);
      if (!game) return false;

      const updatedState = {
        ...game.state,
        players: game.state.players.filter((p: any) => p.id !== playerId),
        lastStateUpdate: Date.now()
      };

      await this.updateGame(gameCode, updatedState);
      return true;
    } catch (error) {
      console.error('Error kicking player:', error);
      return false;
    }
  },

  async endRound(gameCode: string, winningPlayerId: string) {
    try {
      const game = await this.getGame(gameCode);
      if (!game) return false;

      const updatedState = {
        ...game.state,
        players: game.state.players.map((p: any) => 
          p.id === winningPlayerId 
            ? { ...p, money: p.money + (game.state.pot || 0) }
            : p
        ),
        pot: 0,
        bets: [],
        round: (game.state.round || 0) + 1,
        lastStateUpdate: Date.now()
      };

      await this.updateGame(gameCode, updatedState);
      return true;
    } catch (error) {
      console.error('Error ending round:', error);
      return false;
    }
  },

  // Polling function for real-time updates
  async pollGame(gameCode: string, callback: (game: any) => void) {
    let lastUpdate = 0;
    
    const pollInterval = setInterval(async () => {
      const game = await this.getGame(gameCode);
      if (game && game.lastUpdated > lastUpdate) {
        lastUpdate = game.lastUpdated;
        callback(game);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }
}; 