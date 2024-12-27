import { FC, useState } from 'react';
import { X } from 'lucide-react';
import { Player } from '../types';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestLoan: (amount: number, from: string, interestPerRound: number) => void;
  players: Player[];
  currentPlayerId: string;
  bankLoansEnabled: boolean;
}

export const LoanModal: FC<LoanModalProps> = ({
  isOpen,
  onClose,
  onRequestLoan,
  players,
  currentPlayerId,
  bankLoansEnabled
}) => {
  const [amount, setAmount] = useState(300);
  const [from, setFrom] = useState('bank');
  const [interestPerRound, setInterestPerRound] = useState(10);

  if (!isOpen) return null;

  const otherPlayers = players.filter(p => p.id !== currentPlayerId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Request Loan</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan From
            </label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              {bankLoansEnabled && <option value="bank">Bank</option>}
              {otherPlayers.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name} (${player.money} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border rounded-md p-2"
              min={1}
              max={from === 'bank' ? 300 : undefined}
            />
          </div>

          {from !== 'bank' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Per Round
              </label>
              <input
                type="number"
                value={interestPerRound}
                onChange={(e) => setInterestPerRound(Number(e.target.value))}
                className="w-full border rounded-md p-2"
                min={0}
              />
            </div>
          )}

          <button
            onClick={() => {
              onRequestLoan(amount, from, interestPerRound);
              onClose();
            }}
            className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Request Loan
          </button>
        </div>
      </div>
    </div>
  );
};