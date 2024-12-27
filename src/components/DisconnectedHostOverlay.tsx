import { FC } from 'react';
import { WifiOff } from 'lucide-react';

export const DisconnectedHostOverlay: FC = () => {
  return (
    <div className="fixed inset-0 bg-red-900/95 flex items-center justify-center z-50">
      <div className="text-center p-6">
        <WifiOff className="w-16 h-16 text-white mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Host Disconnected</h2>
        <p className="text-white/80">
          The game host has left the game. Please wait or try rejoining later.
        </p>
      </div>
    </div>
  );
}; 