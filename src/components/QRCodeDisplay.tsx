import { FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../context/GameContext';

interface QRCodeDisplayProps {
  gameCode: string;
}

export const QRCodeDisplay: FC<QRCodeDisplayProps> = ({ gameCode }) => {
  const { state } = useGame();
  
  // Include the full state in a base64 encoded format
  const gameState = JSON.stringify({
    gameCode,
    initialMoney: state.initialMoney,
    bankLoansEnabled: state.bankLoansEnabled,
    currentRound: state.currentRound,
    currentEpoch: state.currentEpoch,
    players: state.players,
    moneyPool: state.moneyPool,
    gameStatus: state.gameStatus
  });

  const encodedState = btoa(gameState);
  const joinUrl = `${window.location.origin}?code=${gameCode}&state=${encodedState}&v=1`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
      <QRCodeSVG
        value={joinUrl}
        size={200}
        level="L"
        includeMargin={true}
        className="mx-auto"
      />
      <p className="text-gray-600 text-sm text-center mt-2">
        Scan to join game
      </p>
    </div>
  );
};