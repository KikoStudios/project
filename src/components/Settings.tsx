import { FC, useState } from 'react';
import { X } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useGame();
  const [initialMoney, setInitialMoney] = useState(state.initialMoney);

  const handleSaveSettings = () => {
    dispatch({
      type: 'SET_INITIAL_MONEY',
      payload: { 
        amount: initialMoney,
        updateExisting: true // New flag to update existing players
      }
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Game Settings</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-white mb-2">
              Initial Money (will update all players)
            </label>
            <input
              type="number"
              value={initialMoney}
              onChange={(e) => setInitialMoney(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div className="flex justify-between items-center">
            <label className="text-white">Enable Bank Loans</label>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_BANK_LOANS' })}
              className={`w-12 h-6 rounded-full transition-colors ${
                state.bankLoansEnabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  state.bankLoansEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};