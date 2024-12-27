import { FC } from 'react';
import { Card } from '../types';

interface CommunityCardsProps {
  cards: Card[];
  currentRound: number;
}

export const CommunityCards: FC<CommunityCardsProps> = ({ cards, currentRound }) => {
  return (
    <div className="flex justify-center space-x-2 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`w-16 h-24 rounded-lg flex items-center justify-center text-2xl
            ${index < currentRound 
              ? 'bg-white shadow-lg' 
              : 'bg-gray-700 text-transparent'
            }
            ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'}`}
        >
          {index < currentRound ? (
            <>
              <span>{card.value}</span>
              <span>{card.suit}</span>
            </>
          ) : '?'}
        </div>
      ))}
    </div>
  );
};