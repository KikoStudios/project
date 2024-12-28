import { FC } from 'react';

interface EndBettingConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  canCancel: boolean;
}

export const EndBettingConfirmModal: FC<EndBettingConfirmModalProps> = ({
  onConfirm,
  onCancel,
  canCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 w-full max-w-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">End Betting</h2>
          <p className="text-lg text-white/80">
            {canCancel 
              ? "You're ending your bets for this epoch. Wait for other players to end their bets."
              : "All players have ended betting. Waiting for host to evaluate the game."
            }
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {canCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-red-500 text-white py-4 rounded-lg text-lg font-semibold"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`w-full bg-green-500 text-white py-4 rounded-lg text-lg font-semibold ${
              !canCancel ? 'col-span-2' : ''
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}; 