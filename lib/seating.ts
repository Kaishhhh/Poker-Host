export interface SeatAssignment {
  playerId: string;
  tableId: string;
  seatNumber: number;
}

export interface TableConfig {
  id: string;
  maxSeats: number;
  currentPlayerCount: number;
}

export function assignSeatsBalanced(
  playerIds: string[],
  tables: TableConfig[]
): SeatAssignment[] {
  const assignments: SeatAssignment[] = [];
  const tableSeats: Map<string, number[]> = new Map();

  // Build available seat lists per table
  for (const table of tables) {
    const usedSeats = table.currentPlayerCount;
    const available: number[] = [];
    for (let s = 1; s <= table.maxSeats; s++) {
      if (s > usedSeats) available.push(s);
    }
    tableSeats.set(table.id, available);
  }

  // Round-robin across tables
  let tableIndex = 0;
  for (const playerId of playerIds) {
    let assigned = false;
    let attempts = 0;

    while (!assigned && attempts < tables.length) {
      const table = tables[tableIndex % tables.length];
      const seats = tableSeats.get(table.id) ?? [];

      if (seats.length > 0) {
        const seatNumber = seats.shift()!;
        assignments.push({ playerId, tableId: table.id, seatNumber });
        assigned = true;
      }

      tableIndex++;
      attempts++;
    }
  }

  return assignments;
}
