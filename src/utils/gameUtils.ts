export const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
export const ROUNDS_PER_EPOCH = 5;

export const createDeck = () => {
  const suits = ['♠', '♣', '♥', '♦'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: { value: string; suit: string; }[] = [];
  
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ value, suit });
    }
  }
  
  return shuffle(deck);
};

export const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const isGameExpired = (lastActive: number): boolean => {
  return Date.now() - lastActive > INACTIVE_TIMEOUT;
};