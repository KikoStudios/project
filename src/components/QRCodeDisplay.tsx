import { FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  gameCode: string;
}

export const QRCodeDisplay: FC<QRCodeDisplayProps> = ({ gameCode }) => {
  const joinUrl = `${window.location.origin}?code=${gameCode}`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
      <QRCodeSVG
        value={joinUrl}
        size={200}
        level="H"
        includeMargin={true}
        className="mx-auto"
      />
      <p className="text-gray-600 text-sm text-center mt-2">
        Scan to join game
      </p>
    </div>
  );
}