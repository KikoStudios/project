export interface Player {
  id: string;
  name: string;
  money: number;
  isFolded: boolean;
  currentBet: number;
  loans: Loan[];
  isActive: boolean;
  lastActive: number;
  isAllIn: boolean;
  lastBetAmount: number;
  needsAction: boolean;
  hasEndedBetting: boolean;
}

export interface Loan {
  id: string;
  from: string;
  amount: number;
  interestType: 'overall' | 'per_round' | 'gift';
  interestAmount: number;
  totalOwed: number;
  isPaid: boolean;
}

export interface Card {
  value: string;
  suit: string;
}

export interface LoanRequest {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  interestType: 'overall' | 'per_round';
  interestAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface GameState {
  gameCode: string;
  host: string;
  hostLastActive: number;
  players: Player[];
  currentRound: number;
  currentEpoch: number;
  highestBet: number;
  moneyPool: number;
  bankLoansEnabled: boolean;
  initialMoney: number;
  communityCards: Card[];
  gameStatus: 'waiting' | 'active' | 'finished' | 'cancelled' | 'host_reconnecting';
  lastStateUpdate: number;
  loanRequests?: LoanRequest[];
  spectators: string[];
  actionLog: GameAction[];
  showWinnerSelection: boolean;
}

export interface GameAction {
  type: string;
  playerId?: string;
  playerName?: string;
  amount?: number;
  timestamp: number;
  description: string;
}