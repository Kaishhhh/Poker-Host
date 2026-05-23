export interface PayoutPlace {
  place: number;
  percentage: number;
  amount: number;
}

// Standard payout percentages by number of ITM spots
const PAYOUT_TABLES: Record<number, number[]> = {
  1: [100],
  2: [65, 35],
  3: [50, 30, 20],
  4: [42, 28, 18, 12],
  5: [38, 25, 16, 12, 9],
  6: [35, 23, 15, 11, 9, 7],
  7: [32, 22, 14, 10, 9, 8, 5],
  8: [30, 21, 13, 10, 9, 8, 5, 4],
  9: [28, 20, 13, 10, 8, 7, 6, 5, 3],
  10: [26, 19, 12, 10, 8, 7, 6, 5, 4, 3],
};

function itmSpots(players: number): number {
  if (players <= 6) return 1;
  if (players <= 9) return 2;
  if (players <= 15) return 3;
  if (players <= 20) return 4;
  if (players <= 30) return 5;
  if (players <= 40) return 6;
  if (players <= 50) return 7;
  if (players <= 60) return 8;
  if (players <= 80) return 9;
  return 10;
}

export function calculatePayouts(
  prizePool: number,
  totalPlayers: number
): PayoutPlace[] {
  const spots = itmSpots(totalPlayers);
  const percentages = PAYOUT_TABLES[Math.min(spots, 10)];

  let remaining = prizePool;
  const places: PayoutPlace[] = [];

  for (let i = 0; i < percentages.length; i++) {
    const isLast = i === percentages.length - 1;
    const amount = isLast
      ? remaining
      : Math.floor((prizePool * percentages[i]) / 100);

    places.push({
      place: i + 1,
      percentage: percentages[i],
      amount,
    });

    remaining -= amount;
  }

  return places;
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}
