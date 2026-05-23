export interface ClockState {
  levelStartedAt: bigint | null;
  isPaused: boolean;
  pausedSecondsRemaining: number | null;
  durationMinutes: number;
}

export function getRemainingSeconds(state: ClockState): number {
  const durationSeconds = state.durationMinutes * 60;

  if (state.isPaused) {
    return state.pausedSecondsRemaining ?? durationSeconds;
  }

  if (!state.levelStartedAt) return durationSeconds;

  const elapsed = (Date.now() - Number(state.levelStartedAt)) / 1000;
  return Math.max(0, durationSeconds - elapsed);
}

export function formatTime(totalSeconds: number): string {
  const s = Math.ceil(totalSeconds);
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
