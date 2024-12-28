import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { GameState, Player, Loan } from '../types';
import { ROUNDS_PER_EPOCH } from '../utils/gameUtils';

type GameAction =
  | { type: 'JOIN_GAME'; payload: { player: Player } }
  | { type: 'START_NEW_ROUND' }
  | { type: 'START_NEW_EPOCH' }
  | { type: 'PLACE_BET'; payload: { playerId: string; amount: number } }
  | { type: 'FOLD'; payload: { playerId: string } }
  | { type: 'TAKE_LOAN'; payload: { playerId: string; loan: Loan } }
  | { type: 'SET_INITIAL_STATE'; payload: GameState }
  | { type: 'TOGGLE_BANK_LOANS' }
  | { type: 'SET_INITIAL_MONEY'; payload: { amount: number; updateExisting: boolean } }
  | { type: 'CANCEL_GAME' }
  | { type: 'APPROVE_LOAN'; payload: { loanRequestId: string } }
  | { type: 'ADD_SPECTATOR'; payload: { spectatorId: string } }
  | { type: 'REMOVE_SPECTATOR'; payload: { spectatorId: string } }
  | { type: 'LOG_ACTION'; payload: GameAction }
  | { type: 'SET_NEEDS_ACTION'; payload: { playerId: string; needsAction: boolean } }
  | { type: 'END_BETTING'; payload: { playerId: string } }
  | { type: 'SELECT_WINNER'; payload: { playerId: string } }
  | { type: 'REJECT_LOAN'; payload: { loanRequestId: string } }
  | { type: 'PAY_LOAN'; payload: { playerId: string; loanId: string; amount: number } }
  | { type: 'KICK_PLAYER'; payload: { playerId: string } }
  | { type: 'RECOVER_ACCOUNT'; payload: { sourcePlayerId: string; targetPlayerId: string } }
  | { type: 'CANCEL_END_BETTING'; payload: { playerId: string } };

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'JOIN_GAME': {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('code')?.toUpperCase();
      
      // Get existing game state from localStorage
      const existingGameState = localStorage.getItem(`game_${codeFromUrl}`);
      if (!existingGameState) {
        alert('Game not found');
        return state;
      }

      const gameState = JSON.parse(existingGameState);
      const newPlayer = action.payload.player;
      
      // Check if player already exists
      const existingPlayer = gameState.players.find(p => p.id === newPlayer.id);
      if (existingPlayer) {
        return gameState; // Return existing state if player already exists
      }
      
      // Create new state with the new player
      const newState = {
        ...gameState,
        gameStatus: 'active',
        players: [...gameState.players, newPlayer],
        lastStateUpdate: Date.now()
      };

      // Save to localStorage immediately
      localStorage.setItem(`game_${codeFromUrl}`, JSON.stringify(newState));
      
      return newState;
    }

    case 'SET_INITIAL_STATE': {
      // Only update if this is for our game code
      const params = new URLSearchParams(window.location.search);
      const currentGameCode = params.get('code')?.toUpperCase();
      
      if (currentGameCode === action.payload.gameCode) {
        return {
          ...action.payload,
          lastStateUpdate: Date.now()
        };
      }
      return state;
    }

    case 'START_NEW_ROUND': {
      const timestamp = Date.now();
      const newState = {
        ...state,
        currentRound: state.currentRound + 1,
        players: state.players.map(p => ({
          ...p,
          currentBet: 0,
          lastBetAmount: 0,
          needsAction: !p.isFolded,
          hasEndedBetting: false
        })),
        highestBet: 0,
        lastStateUpdate: timestamp
      };

      // Force immediate state update
      const gameCode = state.gameCode;
      localStorage.setItem(`game_${gameCode}`, JSON.stringify(newState));

      // Add a small delay to ensure all clients receive the update
      setTimeout(() => {
        const storedState = localStorage.getItem(`game_${gameCode}`);
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          if (parsedState.lastStateUpdate === timestamp) {
            return newState;
          }
        }
      }, 100);

      return newState;
    }

    case 'START_NEW_EPOCH': {
      const newState = {
        ...state,
        currentEpoch: state.currentEpoch + 1,
        currentRound: 0,
        highestBet: 0,
        moneyPool: 0, // Reset pool at epoch end
        players: state.players.map(p => ({ 
          ...p, 
          isFolded: false, 
          currentBet: 0,
          needsAction: true,
          hasEndedBetting: false
        })),
        showWinnerSelection: false,
        lastStateUpdate: Date.now()
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'PLACE_BET': {
      const { playerId, amount } = action.payload;
      const player = state.players.find(p => p.id === playerId);
      
      if (!player || player.money < amount || player.isFolded) return state;
      
      const newBetAmount = player.currentBet + amount;
      const isAllIn = player.money === amount;
      
      const newState = {
        ...state,
        players: state.players.map(p => 
          p.id === playerId
            ? { 
                ...p, 
                money: p.money - amount,
                currentBet: newBetAmount,
                lastBetAmount: amount,
                isAllIn,
                needsAction: false
              }
            : {
                ...p,
                needsAction: p.currentBet < Math.max(state.highestBet, newBetAmount) && !p.isFolded
              }
        ),
        highestBet: Math.max(state.highestBet, newBetAmount),
        moneyPool: state.moneyPool + amount,
        lastStateUpdate: Date.now()
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'FOLD': {
      const { playerId } = action.payload;
      const timestamp = Date.now();
      
      // Create new state with the player folded
      const newState = {
        ...state,
        players: state.players.map(p =>
          p.id === playerId
            ? { 
                ...p, 
                isFolded: true,
                needsAction: false
              }
            : p
        ),
        lastStateUpdate: timestamp
      };

      // Check if only one player remains
      const activePlayers = newState.players.filter(p => !p.isFolded);
      if (activePlayers.length === 1) {
        // Give the pot to the last remaining player
        const winner = activePlayers[0];
        newState.players = newState.players.map(p => 
          p.id === winner.id
            ? { ...p, money: p.money + state.moneyPool }
            : p
        );
        newState.moneyPool = 0;
        newState.currentRound = 0;
        newState.currentEpoch += 1;
        // Reset all players for next epoch
        newState.players = newState.players.map(p => ({
          ...p,
          isFolded: false,
          currentBet: 0,
          needsAction: true,
          hasEndedBetting: false
        }));
      }

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'TAKE_LOAN': {
      const { playerId, loan } = action.payload;
      const timestamp = Date.now();

      // Calculate initial total owed based on loan type
      const initialTotalOwed = loan.interestType === 'overall'
        ? loan.amount + loan.interestAmount // Fixed amount interest
        : loan.amount; // For per-round interest, start with just the principal

      // If it's a player loan, create a pending loan request
      if (loan.from !== 'bank') {
        const newState = {
          ...state,
          loanRequests: [
            ...(state.loanRequests || []),
            {
              id: crypto.randomUUID(),
              fromPlayerId: loan.from,
              toPlayerId: playerId,
              amount: loan.amount,
              interestType: loan.interestType,
              interestAmount: loan.interestAmount,
              totalOwed: initialTotalOwed,
              status: 'pending',
              timestamp: Date.now()
            }
          ],
          lastStateUpdate: timestamp
        };
        localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
        return newState;
      }

      // For bank loans or direct loans
      const newState = {
        ...state,
        players: state.players.map(p =>
          p.id === playerId
            ? {
                ...p,
                money: p.money + loan.amount,
                loans: [...p.loans, { ...loan, totalOwed: initialTotalOwed }]
              }
            : p
        ),
        lastStateUpdate: timestamp
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'SET_PLAYER_ACTIVE':
    case 'SET_PLAYER_INACTIVE': {
      const isActive = action.type === 'SET_PLAYER_ACTIVE';
      const timestamp = Date.now();
      
      // Only update if we have a valid player ID
      if (!action.payload.playerId) return state;

      const newState = {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, isActive, lastActive: timestamp }
            : p
        ),
        lastStateUpdate: timestamp
      };

      // Save to localStorage
      const gameCode = new URLSearchParams(window.location.search).get('code')?.toUpperCase();
      if (gameCode) {
        localStorage.setItem(`game_${gameCode}`, JSON.stringify(newState));
      }

      return newState;
    }

    case 'TOGGLE_BANK_LOANS':
      return {
        ...state,
        bankLoansEnabled: !state.bankLoansEnabled,
        lastStateUpdate: Date.now()
      };

    case 'SET_INITIAL_MONEY': {
      const { amount, updateExisting } = action.payload;
      const timestamp = Date.now();
      
      const newState = {
        ...state,
        initialMoney: amount,
        lastStateUpdate: timestamp
      };

      // If updateExisting is true, update all players' money
      if (updateExisting) {
        newState.players = state.players.map(player => ({
          ...player,
          money: amount
        }));
      }

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'CANCEL_GAME':
      return {
        ...state,
        gameStatus: 'cancelled',
        lastStateUpdate: Date.now()
      };

    case 'APPROVE_LOAN': {
      const { loanRequestId } = action.payload;
      const timestamp = Date.now();
      
      const loanRequest = state.loanRequests?.find(lr => lr.id === loanRequestId);
      if (!loanRequest || loanRequest.status !== 'pending') return state;

      const newState = {
        ...state,
        players: state.players.map(player => {
          if (player.id === loanRequest.toPlayerId) {
            return {
              ...player,
              money: player.money + loanRequest.amount,
              loans: [...player.loans, {
                from: loanRequest.fromPlayerId,
                amount: loanRequest.amount,
                interestPerRound: loanRequest.interestPerRound,
                totalOwed: loanRequest.amount
              }]
            };
          }
          if (player.id === loanRequest.fromPlayerId) {
            return {
              ...player,
              money: player.money - loanRequest.amount
            };
          }
          return player;
        }),
        loanRequests: state.loanRequests?.map(lr =>
          lr.id === loanRequestId
            ? { ...lr, status: 'approved' }
            : lr
        ),
        lastStateUpdate: timestamp
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'ADD_SPECTATOR': {
      const { spectatorId } = action.payload;
      const timestamp = Date.now();
      
      const newState = {
        ...state,
        spectators: [...state.spectators, spectatorId],
        lastStateUpdate: timestamp
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'REMOVE_SPECTATOR': {
      const { spectatorId } = action.payload;
      const timestamp = Date.now();
      
      const newState = {
        ...state,
        spectators: state.spectators.filter(id => id !== spectatorId),
        lastStateUpdate: timestamp
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'LOG_ACTION': {
      const { payload } = action;
      const timestamp = Date.now();
      
      const newState = {
        ...state,
        actionLog: [...state.actionLog, payload],
        lastStateUpdate: timestamp
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'SET_NEEDS_ACTION': {
      const { playerId, needsAction } = action.payload;
      const timestamp = Date.now();
      
      const newState = {
        ...state,
        players: state.players.map(p =>
          p.id === playerId
            ? { ...p, needsAction }
            : p
        ),
        lastStateUpdate: timestamp
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'END_BETTING': {
      const newState = {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, hasEndedBetting: true }
            : p
        ),
        lastStateUpdate: Date.now()
      };

      // Check if all non-folded players have ended betting
      const activePlayers = newState.players.filter(p => !p.isFolded);
      const allEndedBetting = activePlayers.every(p => p.hasEndedBetting);
      
      if (allEndedBetting) {
        newState.showWinnerSelection = true;
      }

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'SELECT_WINNER': {
      const newState = {
        ...state,
        currentEpoch: state.currentEpoch + 1,
        currentRound: 0,
        moneyPool: 0,
        showWinnerSelection: false,
        players: state.players.map(p => ({
          ...p,
          isFolded: false,
          currentBet: 0,
          needsAction: true,
          hasEndedBetting: false,
          money: p.id === action.payload.playerId ? p.money + state.moneyPool : p.money
        })),
        lastStateUpdate: Date.now()
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'REJECT_LOAN': {
      const { loanRequestId } = action.payload;
      const timestamp = Date.now();
      
      const newState = {
        ...state,
        loanRequests: state.loanRequests?.map(lr =>
          lr.id === loanRequestId
            ? { ...lr, status: 'rejected' }
            : lr
        ),
        lastStateUpdate: timestamp
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'PAY_LOAN': {
      const { playerId, loanId, amount } = action.payload;
      const timestamp = Date.now();

      // Find the loan and lender first
      const borrower = state.players.find(p => p.id === playerId);
      const loan = borrower?.loans.find(l => l.id === loanId);
      const lender = state.players.find(p => p.id === loan?.from);

      if (!borrower || !loan || !lender) return state;

      // Calculate payback amount based on current round
      const paybackAmount = loan.interestType === 'overall'
        ? loan.amount + loan.interestAmount // Fixed total amount
        : loan.totalOwed; // Current accumulated amount

      const newState = {
        ...state,
        players: state.players.map(p => {
          if (p.id === playerId) {
            return {
              ...p,
              money: p.money - paybackAmount,
              loans: p.loans.map(l => 
                l.id === loanId
                  ? { ...l, isPaid: true, totalOwed: 0 }
                  : l
              )
            };
          }
          if (p.id === loan.from) {
            return {
              ...p,
              money: p.money + paybackAmount
            };
          }
          return p;
        }),
        lastStateUpdate: timestamp
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'KICK_PLAYER': {
      const newState = {
        ...state,
        players: state.players.filter(p => p.id !== action.payload.playerId),
        lastStateUpdate: Date.now()
      };
      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'RECOVER_ACCOUNT': {
      const { sourcePlayerId, targetPlayerId } = action.payload;
      const sourcePlayer = state.players.find(p => p.id === sourcePlayerId);
      
      if (!sourcePlayer) return state;

      const newState = {
        ...state,
        players: state.players.map(p => {
          if (p.id === targetPlayerId) {
            // Transfer money and loans to target player
            return {
              ...p,
              money: sourcePlayer.money,
              loans: [...p.loans, ...sourcePlayer.loans]
            };
          }
          if (p.id === sourcePlayerId) {
            // Reset source player
            return {
              ...p,
              money: state.initialMoney,
              loans: []
            };
          }
          return p;
        }),
        lastStateUpdate: Date.now()
      };

      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    case 'CANCEL_END_BETTING': {
      const newState = {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, hasEndedBetting: false }
            : p
        ),
        lastStateUpdate: Date.now()
      };
      
      localStorage.setItem(`game_${state.gameCode}`, JSON.stringify(newState));
      return newState;
    }

    default:
      return state;
  }
};

export const initialState: GameState = {
  gameCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
  host: '',
  hostLastActive: Date.now(),
  players: [],
  currentRound: 0,
  currentEpoch: 0,
  highestBet: 0,
  moneyPool: 0,
  bankLoansEnabled: true,
  initialMoney: 1000,
  gameStatus: 'waiting',
  lastStateUpdate: Date.now(),
  communityCards: [],
  spectators: [],
  actionLog: [],
  showWinnerSelection: false,
  loanRequests: []
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize game state from URL if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code')?.toUpperCase();
    
    if (codeFromUrl) {
      const storedState = localStorage.getItem(`game_${codeFromUrl}`);
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        dispatch({ 
          type: 'SET_INITIAL_STATE', 
          payload: parsedState 
        });
      }
    }
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};