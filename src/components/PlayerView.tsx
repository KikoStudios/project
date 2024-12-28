import { useState, useEffect } from 'react';
import { useGameSession } from '../hooks/useGameSession';
import { useGame } from '../context/GameContext';
import { HandCoins, Users } from 'lucide-react';
import { ROUNDS_PER_EPOCH } from '../utils/gameUtils';
import { LoanRequestModal } from './LoanRequestModal';
import { KickedOverlay } from './KickedOverlay';
import { DisconnectedHostOverlay } from './DisconnectedHostOverlay';
import { BettingControls } from './BettingControls';
import { EndBettingConfirmModal } from './EndBettingConfirmModal';

export const PlayerView = () => {
  const state = useGameSession();
  const { dispatch } = useGame();
  const [showLoanOptions, setShowLoanOptions] = useState(false);
  const [selectedLender, setSelectedLender] = useState('');
  const [loanAmount, setLoanAmount] = useState(300);
  const [interestRate, setInterestRate] = useState(10);
  const [pendingLoanRequest, setPendingLoanRequest] = useState<any>(null);
  const [loanInterestType, setLoanInterestType] = useState<'overall' | 'per_round'>('overall');
  const [loanInterestAmount, setLoanInterestAmount] = useState(50);
  const [isKicked, setIsKicked] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [showEndBettingModal, setShowEndBettingModal] = useState(false);
  
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get('playerId');
  const player = state.players.find(p => p.id === playerId);

  if (!player) return null;

  useEffect(() => {
    if (state.gameStatus === 'cancelled') {
      alert('The host has ended the game');
      window.location.href = '/'; // Redirect to home
    }
  }, [state.gameStatus]);

  useEffect(() => {
    // Check for loan requests directed to this player
    const loanRequest = state.loanRequests?.find(
      lr => lr.fromPlayerId === player.id && lr.status === 'pending'
    );
    if (loanRequest) {
      const requester = state.players.find(p => p.id === loanRequest.toPlayerId);
      setPendingLoanRequest({
        ...loanRequest,
        requesterName: requester?.name
      });
    } else {
      setPendingLoanRequest(null);
    }
  }, [state.loanRequests, player.id]);

  useEffect(() => {
    // Poll for game state updates every second
    const interval = setInterval(() => {
      const gameCode = new URLSearchParams(window.location.search).get('code');
      if (gameCode) {
        const storedState = localStorage.getItem(`game_${gameCode}`);
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          if (parsedState.lastStateUpdate !== state.lastStateUpdate) {
            // Update local state if there's a newer version
            dispatch({ 
              type: 'SET_INITIAL_STATE', 
              payload: parsedState 
            });
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Force re-render when round changes
    console.log('Round changed:', state.currentRound);
  }, [state.currentRound]);

  const handlePlaceBet = (amount: number) => {
    if (amount <= 0 || amount > player.money) return;
    
    dispatch({
      type: 'PLACE_BET',
      payload: { playerId: player.id, amount }
    });
  };

  const handleBankLoan = () => {
    if (player.money > 0) {
      alert('You can only take a bank loan when you have no money');
      return;
    }

    dispatch({
      type: 'TAKE_LOAN',
      payload: {
        playerId: player.id,
        loan: {
          from: 'bank',
          amount: 300,
          interestPerRound: 0,
          totalOwed: 300
        }
      }
    });
  };

  const handleFold = () => {
    dispatch({
      type: 'FOLD',
      payload: { playerId: player.id }
    });
  };

  const handlePlayerLoan = () => {
    if (!selectedLender) return;
    
    dispatch({
      type: 'TAKE_LOAN',
      payload: {
        playerId: player.id,
        loan: {
          id: crypto.randomUUID(),
          from: selectedLender,
          amount: loanAmount,
          interestType: isGift ? 'gift' : loanInterestType,
          interestAmount: isGift ? 0 : loanInterestAmount,
          totalOwed: isGift ? 0 : loanAmount + (loanInterestType === 'overall' ? loanInterestAmount : 0),
          isPaid: isGift
        }
      }
    });
    setShowLoanOptions(false);
  };

  const handlePayLoan = (loanId: string) => {
    const loan = player.loans.find(l => l.id === loanId);
    if (!loan || player.money < loan.totalOwed) return;

    dispatch({
      type: 'PAY_LOAN',
      payload: {
        playerId: player.id,
        loanId,
        amount: loan.totalOwed
      }
    });
  };

  const otherPlayers = state.players.filter(p => p.id !== player.id);

  const minBet = Math.max(0, state.highestBet - player.currentBet);
  const canBet = state.currentRound > 0 && !player.isFolded && player.money > 0;
  const canTakeLoan = player.money === 0 && state.bankLoansEnabled;
  const needsToCall = player.currentBet < state.highestBet && !player.isFolded;
  const isLastRound = state.currentRound === ROUNDS_PER_EPOCH;

  const handleAcceptLoan = () => {
    if (!pendingLoanRequest) return;
    dispatch({
      type: 'APPROVE_LOAN',
      payload: { loanRequestId: pendingLoanRequest.id }
    });
    setPendingLoanRequest(null);
  };

  const handleRejectLoan = () => {
    if (!pendingLoanRequest) return;
    dispatch({
      type: 'REJECT_LOAN',
      payload: { loanRequestId: pendingLoanRequest.id }
    });
    setPendingLoanRequest(null);
  };

  useEffect(() => {
    const currentPlayer = state.players.find(p => p.id === playerId);
    if (!currentPlayer) {
      setIsKicked(true);
    }
  }, [state.players, playerId]);

  const hostDisconnected = state.gameStatus === 'host_reconnecting';

  const allPlayersEndedBetting = () => {
    const activePlayers = state.players.filter(p => !p.isFolded);
    return activePlayers.every(p => p.hasEndedBetting);
  };

  if (isKicked) {
    return <KickedOverlay />;
  }

  const renderModals = () => (
    <>
      {hostDisconnected && <DisconnectedHostOverlay />}
      {pendingLoanRequest && (
        <LoanRequestModal
          request={pendingLoanRequest}
          onAccept={handleAcceptLoan}
          onReject={handleRejectLoan}
        />
      )}
    </>
  );

  if (player.isFolded) {
    return (
      <>
        {renderModals()}
        <div className="min-h-screen bg-red-900/90 p-6">
          <div className="max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl text-center">
              <h2 className="text-3xl font-bold text-white mb-4">YOU FOLDED</h2>
              <p className="text-white/80 mb-4">Waiting for next epoch to start...</p>
              
              <div className="grid grid-cols-2 gap-4 text-white/60 mb-6">
                <div>
                  <div className="text-sm">Current Round</div>
                  <div className="text-2xl font-bold">{state.currentRound}</div>
                </div>
                <div>
                  <div className="text-sm">Rounds Until Next Epoch</div>
                  <div className="text-2xl font-bold">{ROUNDS_PER_EPOCH - state.currentRound}</div>
                </div>
              </div>

              {/* Add Loan Section */}
              <div className="border-t border-white/10 pt-6">
                <div className="text-white mb-4">You can still manage loans while waiting</div>
                
                {/* Show current loans if any */}
                {player.loans.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-2">Current Loans</h3>
                    <div className="space-y-2">
                      {player.loans.filter(loan => !loan.isPaid).map((loan) => (
                        <div key={loan.id} className="bg-white/5 rounded p-3 flex justify-between items-center">
                          <div className="text-sm text-white/80">
                            <div>${loan.amount} from {loan.from}</div>
                            <div className="text-xs text-white/60">
                              Owed: ${loan.totalOwed}
                            </div>
                          </div>
                          {player.money >= loan.totalOwed && (
                            <button
                              onClick={() => handlePayLoan(loan.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Pay ${loan.totalOwed}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loan Request Button */}
                <button
                  onClick={() => setShowLoanOptions(!showLoanOptions)}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg mt-2 flex items-center justify-center"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Request Player Loan
                </button>

                {/* Loan Request Form */}
                {showLoanOptions && (
                  <div className="mt-4 space-y-4 bg-white/5 p-4 rounded-lg">
                    <select
                      value={selectedLender}
                      onChange={(e) => setSelectedLender(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white"
                    >
                      <option value="">Select Player</option>
                      {otherPlayers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.money} available)
                        </option>
                      ))}
                    </select>

                    <div>
                      <label className="block text-sm text-white mb-1">Loan Amount</label>
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isGift"
                        checked={isGift}
                        onChange={(e) => {
                          setIsGift(e.target.checked);
                          if (e.target.checked) {
                            setLoanInterestAmount(0);
                          }
                        }}
                        className="rounded border-white/20"
                      />
                      <label htmlFor="isGift" className="text-white text-sm">
                        Send as Gift (No Repayment Required)
                      </label>
                    </div>

                    {!isGift && (
                      <>
                        <div>
                          <label className="block text-sm text-white mb-1">Interest Type</label>
                          <select
                            value={loanInterestType}
                            onChange={(e) => setLoanInterestType(e.target.value as 'overall' | 'per_round')}
                            className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white"
                          >
                            <option value="overall">Overall Fixed Amount</option>
                            <option value="per_round">Per Round Interest</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-white mb-1">
                            {loanInterestType === 'overall' ? 'Total Interest Amount' : 'Interest Per Round'}
                          </label>
                          <input
                            type="number"
                            value={loanInterestAmount}
                            onChange={(e) => setLoanInterestAmount(Number(e.target.value))}
                            className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white"
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={handlePlayerLoan}
                      disabled={!selectedLender || loanAmount <= 0}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg disabled:opacity-50"
                    >
                      {isGift ? 'Send Gift' : 'Request Loan'}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 text-sm text-white/40">
                You can play again when the next epoch starts
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  console.log('Current Round:', state.currentRound);
  console.log('Can Bet:', canBet);

  console.log('Game State:', {
    currentRound: state.currentRound,
    currentEpoch: state.currentEpoch,
    canBet,
    isFolded: player.isFolded,
    money: player.money,
    minBet,
    highestBet: state.highestBet
  });

  console.log('Debug Betting UI:', {
    currentRound: state.currentRound,
    canBet,
    conditions: {
      roundCheck: state.currentRound >= 1,
      notFolded: !player.isFolded,
      hasMoney: player.money >= minBet
    },
    player: {
      money: player.money,
      isFolded: player.isFolded
    },
    minBet,
    highestBet: state.highestBet
  });

  return (
    <>
      {renderModals()}
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">{player.name}</h2>
              <div className="text-4xl font-bold text-green-400">${player.money}</div>
              {player.isFolded && (
                <div className="mt-2 bg-red-500/20 text-red-300 py-1 px-3 rounded inline-block">
                  Folded
                </div>
              )}
              {player.loans.length > 0 && (
                <div className="text-sm text-red-400 mt-2">
                  Total Debt: ${player.loans.reduce((sum, loan) => sum + loan.totalOwed, 0)}
                </div>
              )}
            </div>

            {state.currentRound >= 1 && (
              <div className="space-y-4 mb-6">
                <BettingControls
                  minBet={minBet}
                  maxBet={player.money}
                  onBet={handlePlaceBet}
                  onFold={handleFold}
                />
                {needsToCall && (
                  <p className="text-sm text-yellow-400 mt-1">
                    Minimum bet to call: ${minBet}
                  </p>
                )}
              </div>
            )}

            {isLastRound && !player.isFolded && (
              <>
                <button
                  onClick={() => setShowEndBettingModal(true)}
                  className={`w-full ${
                    player.hasEndedBetting 
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600'
                  } text-white py-2 rounded-lg mt-4`}
                  disabled={player.hasEndedBetting}
                >
                  {player.hasEndedBetting ? 'Waiting for Others' : 'End My Bets'}
                </button>

                {showEndBettingModal && (
                  <EndBettingConfirmModal
                    onConfirm={() => {
                      dispatch({ 
                        type: 'END_BETTING', 
                        payload: { playerId: player.id } 
                      });
                      setShowEndBettingModal(false);
                    }}
                    onCancel={() => {
                      if (!allPlayersEndedBetting()) {
                        dispatch({
                          type: 'CANCEL_END_BETTING',
                          payload: { playerId: player.id }
                        });
                        setShowEndBettingModal(false);
                      }
                    }}
                    canCancel={!allPlayersEndedBetting()}
                  />
                )}
              </>
            )}

            <div>
              <button
                onClick={() => setShowLoanOptions(!showLoanOptions)}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg mt-4 flex items-center justify-center"
              >
                <Users className="w-5 h-5 mr-2" />
                Request Player Loan
              </button>

              {showLoanOptions && (
                <div className="mt-4 space-y-4 bg-white/5 p-4 rounded-lg">
                  <select
                    value={selectedLender}
                    onChange={(e) => setSelectedLender(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white"
                  >
                    <option value="">Select Player</option>
                    {otherPlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.money} available)
                      </option>
                    ))}
                  </select>

                  <div>
                    <label className="block text-sm text-white mb-1">Loan Amount</label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isGift"
                      checked={isGift}
                      onChange={(e) => {
                        setIsGift(e.target.checked);
                        if (e.target.checked) {
                          setLoanInterestAmount(0);
                        }
                      }}
                      className="rounded border-white/20"
                    />
                    <label htmlFor="isGift" className="text-white text-sm">
                      Send as Gift (No Repayment Required)
                    </label>
                  </div>

                  {!isGift && (
                    <>
                      <div>
                        <label className="block text-sm text-white mb-1">Interest Type</label>
                        <select
                          value={loanInterestType}
                          onChange={(e) => setLoanInterestType(e.target.value as 'overall' | 'per_round')}
                          className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white"
                        >
                          <option value="overall">Overall Fixed Amount</option>
                          <option value="per_round">Per Round Interest</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-white mb-1">
                          {loanInterestType === 'overall' ? 'Total Interest Amount' : 'Interest Per Round'}
                        </label>
                        <input
                          type="number"
                          value={loanInterestAmount}
                          onChange={(e) => setLoanInterestAmount(Number(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white"
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={handlePlayerLoan}
                    disabled={!selectedLender || loanAmount <= 0}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    {isGift ? 'Send Gift' : 'Request Loan'}
                  </button>
                </div>
              )}
            </div>

            {/* Current Loans Display */}
            {player.loans.length > 0 && (
              <div className="mt-4 p-4 bg-red-500/10 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Current Loans</h3>
                {player.loans.filter(loan => !loan.isPaid).map((loan) => (
                  <div key={loan.id} className="flex justify-between items-center py-2 border-b border-white/10">
                    <div className="text-sm text-red-300">
                      <div>${loan.amount} from {loan.from}</div>
                      <div className="text-xs text-white/60">
                        {loan.interestType === 'overall' 
                          ? `Total to pay back: $${loan.amount + loan.interestAmount}`
                          : `$${loan.amount} + $${loan.interestAmount} per round (Current: $${loan.totalOwed})`}
                      </div>
                    </div>
                    {player.money >= loan.totalOwed && (
                      <button
                        onClick={() => handlePayLoan(loan.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Pay ${loan.totalOwed}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};