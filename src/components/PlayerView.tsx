import { useState, useEffect } from 'react';
import { useGameSession } from '../hooks/useGameSession';
import { useGame } from '../context/GameContext';
import { HandCoins, Users } from 'lucide-react';
import { ROUNDS_PER_EPOCH } from '../utils/gameUtils';
import { LoanRequestModal } from './LoanRequestModal';
import { KickedOverlay } from './KickedOverlay';
import { DisconnectedHostOverlay } from './DisconnectedHostOverlay';

export const PlayerView = () => {
  const state = useGameSession();
  const { dispatch } = useGame();
  const [betAmount, setBetAmount] = useState(0);
  const [showLoanOptions, setShowLoanOptions] = useState(false);
  const [selectedLender, setSelectedLender] = useState('');
  const [loanAmount, setLoanAmount] = useState(300);
  const [interestRate, setInterestRate] = useState(10);
  const [pendingLoanRequest, setPendingLoanRequest] = useState<any>(null);
  const [loanInterestType, setLoanInterestType] = useState<'overall' | 'per_round'>('overall');
  const [loanInterestAmount, setLoanInterestAmount] = useState(50);
  const [isKicked, setIsKicked] = useState(false);
  
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

  const handlePlaceBet = () => {
    if (betAmount <= 0 || betAmount > player.money) return;
    
    dispatch({
      type: 'PLACE_BET',
      payload: { playerId: player.id, amount: betAmount }
    });
    
    setBetAmount(0);
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
          interestType: loanInterestType,
          interestAmount: loanInterestAmount,
          totalOwed: loanAmount + (loanInterestType === 'overall' ? loanInterestAmount : 0),
          isPaid: false
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
  const canBet = state.currentRound > 0 && !player.isFolded && player.money >= minBet;
  const canTakeLoan = player.money === 0 && state.bankLoansEnabled;
  const needsToCall = player.currentBet < state.highestBet && !player.isFolded;
  const isLastRound = state.currentRound === ROUNDS_PER_EPOCH;

  const handleBetAmountChange = (value: number) => {
    // Round to nearest 10
    const roundedValue = Math.round(value / 10) * 10;
    setBetAmount(roundedValue);
  };

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

  if (isKicked) {
    return <KickedOverlay />;
  }

  if (player.isFolded) {
    return (
      <div className="min-h-screen bg-red-900/90 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl text-center">
            <h2 className="text-3xl font-bold text-white mb-4">YOU FOLDED</h2>
            <p className="text-white/80 mb-4">Waiting for next epoch to start...</p>
            <div className="grid grid-cols-2 gap-4 text-white/60">
              <div>
                <div className="text-sm">Current Round</div>
                <div className="text-2xl font-bold">{state.currentRound}</div>
              </div>
              <div>
                <div className="text-sm">Rounds Until Next Epoch</div>
                <div className="text-2xl font-bold">{ROUNDS_PER_EPOCH - state.currentRound}</div>
              </div>
            </div>
            <div className="mt-6 text-sm text-white/40">
              You can play again when the next epoch starts
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {hostDisconnected && <DisconnectedHostOverlay />}
      {pendingLoanRequest && (
        <LoanRequestModal
          request={pendingLoanRequest}
          onAccept={handleAcceptLoan}
          onReject={handleRejectLoan}
        />
      )}

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

            {canBet && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white mb-1">Bet Amount</label>
                  <input
                    type="number"
                    min={minBet}
                    max={player.money}
                    step="10"
                    value={betAmount}
                    onChange={(e) => handleBetAmountChange(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/20 rounded px-4 py-2 text-white"
                  />
                  {needsToCall && (
                    <p className="text-sm text-yellow-400 mt-1">
                      Minimum bet to call: ${minBet}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handlePlaceBet}
                    disabled={betAmount < minBet}
                    className="w-full bg-green-500 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Place Bet
                  </button>
                  <button
                    onClick={handleFold}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
                  >
                    Fold
                  </button>
                </div>
                {isLastRound && (
                  <button
                    onClick={() => dispatch({ type: 'END_BETTING', payload: { playerId: player.id } })}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg mt-4"
                  >
                    End My Bets
                  </button>
                )}
              </div>
            )}

            {/* Simplified Loan Options */}
            <div>
              <button
                onClick={() => setShowLoanOptions(!showLoanOptions)}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg flex items-center justify-center"
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

                  <div className="text-sm text-white/60">
                    You will owe: ${loanAmount + (loanInterestType === 'overall' ? loanInterestAmount : 0)}
                    {loanInterestType === 'per_round' && ' + $' + loanInterestAmount + ' per round'}
                  </div>

                  <button
                    onClick={handlePlayerLoan}
                    disabled={!selectedLender || loanAmount <= 0}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Request Loan
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