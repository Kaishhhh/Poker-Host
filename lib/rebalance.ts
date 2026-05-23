export interface TableWithPlayers {
  id: string;
  tableNumber: number;
  maxSeats: number;
  players: { id: string; seatNumber: number | null }[];
}

export interface RebalanceMove {
  playerId: string;
  fromTableId: string;
  toTableId: string;
  toSeat: number;
}

export function computeRebalanceMoves(tables: TableWithPlayers[]): RebalanceMove[] {
  const activeTables = tables.filter((t) => t.players.length > 0);
  if (activeTables.length <= 1) return [];

  const counts = activeTables.map((t) => t.players.length);
  const avg = Math.floor(counts.reduce((a, b) => a + b, 0) / activeTables.length);

  const donors = activeTables
    .filter((t) => t.players.length > avg + 1)
    .sort((a, b) => b.players.length - a.players.length);

  const receivers = activeTables
    .filter((t) => t.players.length < avg)
    .sort((a, b) => a.players.length - b.players.length);

  const moves: RebalanceMove[] = [];
  const tablePlayerCounts = new Map(activeTables.map((t) => [t.id, t.players.length]));

  // Track which seats are occupied per table
  const occupiedSeats = new Map<string, Set<number>>();
  for (const t of activeTables) {
    occupiedSeats.set(
      t.id,
      new Set(t.players.map((p) => p.seatNumber ?? 0).filter(Boolean))
    );
  }

  function nextFreeSeat(tableId: string, maxSeats: number): number | null {
    const used = occupiedSeats.get(tableId) ?? new Set();
    for (let s = 1; s <= maxSeats; s++) {
      if (!used.has(s)) return s;
    }
    return null;
  }

  for (const donor of donors) {
    const playersToMove = [...donor.players];

    for (const receiver of receivers) {
      const receiverMax = receiver.maxSeats;

      while (
        (tablePlayerCounts.get(donor.id) ?? 0) > avg + 1 &&
        (tablePlayerCounts.get(receiver.id) ?? 0) < avg
      ) {
        const player = playersToMove.pop();
        if (!player) break;

        const toSeat = nextFreeSeat(receiver.id, receiverMax);
        if (!toSeat) break;

        moves.push({
          playerId: player.id,
          fromTableId: donor.id,
          toTableId: receiver.id,
          toSeat,
        });

        occupiedSeats.get(receiver.id)?.add(toSeat);
        tablePlayerCounts.set(donor.id, (tablePlayerCounts.get(donor.id) ?? 0) - 1);
        tablePlayerCounts.set(receiver.id, (tablePlayerCounts.get(receiver.id) ?? 0) + 1);
      }
    }
  }

  return moves;
}
