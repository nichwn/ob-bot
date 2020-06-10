export const calculateMajority = (
  majorityType: 'MAJORITY' | 'SUPERMAJORITY',
  players: number,
) => {
  switch (majorityType) {
    case 'MAJORITY':
      return Math.floor(players / 2) + 1;
    case 'SUPERMAJORITY':
      return Math.floor(players * (2 / 3)) + 1;
  }
};
