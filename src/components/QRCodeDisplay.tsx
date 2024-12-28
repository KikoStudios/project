import { FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../context/GameContext';

interface QRCodeDisplayProps {
  gameCode: string;
}

export const QRCodeDisplay: FC<QRCodeDisplayProps> = ({ gameCode }) => {
  const { state } = useGame();
  
  // Create a simpler join URL with just the game code
  const joinUrl = `${window.location.origin}?code=${gameCode}&v=1`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
      <QRCodeSVG
        value={joinUrl}
        size={200}
        level="L" // Using lowest error correction for simpler QR
        includeMargin={true}
        className="mx-auto"
      />
      <p className="text-gray-600 text-sm text-center mt-2">
        Scan to join game
      </p>
    </div>
  );
};