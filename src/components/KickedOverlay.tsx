import { FC } from 'react';
import { UserX } from 'lucide-react';

export const KickedOverlay: FC = () => {
  return (
    <div className="fixed inset-0 bg-red-900/95 flex items-center justify-center z-50">
      <div className="text-center p-6">
        <UserX className="w-16 h-16 text-white mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">You Have Been Kicked</h2>
        <p className="text-white/80 mb-6">
          The host has removed you from the game.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}; 