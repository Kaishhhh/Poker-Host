export interface BlindLevelInput {
  levelIndex: number;
  isBreak: boolean;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  durationMinutes: number;
  label?: string;
}

export type PresetName = "standard" | "turbo" | "deep" | "casual";

export const BLIND_PRESETS: Record<PresetName, BlindLevelInput[]> = {
  standard: [
    { levelIndex: 0, isBreak: false, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 20 },
    { levelIndex: 1, isBreak: false, smallBlind: 50, bigBlind: 100, ante: 0, durationMinutes: 20 },
    { levelIndex: 2, isBreak: false, smallBlind: 75, bigBlind: 150, ante: 0, durationMinutes: 20 },
    { levelIndex: 3, isBreak: true, durationMinutes: 15, label: "Break" },
    { levelIndex: 4, isBreak: false, smallBlind: 100, bigBlind: 200, ante: 25, durationMinutes: 20 },
    { levelIndex: 5, isBreak: false, smallBlind: 150, bigBlind: 300, ante: 25, durationMinutes: 20 },
    { levelIndex: 6, isBreak: false, smallBlind: 200, bigBlind: 400, ante: 50, durationMinutes: 20 },
    { levelIndex: 7, isBreak: true, durationMinutes: 15, label: "Break" },
    { levelIndex: 8, isBreak: false, smallBlind: 300, bigBlind: 600, ante: 75, durationMinutes: 20 },
    { levelIndex: 9, isBreak: false, smallBlind: 400, bigBlind: 800, ante: 100, durationMinutes: 20 },
    { levelIndex: 10, isBreak: false, smallBlind: 500, bigBlind: 1000, ante: 100, durationMinutes: 20 },
    { levelIndex: 11, isBreak: false, smallBlind: 600, bigBlind: 1200, ante: 200, durationMinutes: 20 },
    { levelIndex: 12, isBreak: false, smallBlind: 800, bigBlind: 1600, ante: 200, durationMinutes: 20 },
    { levelIndex: 13, isBreak: false, smallBlind: 1000, bigBlind: 2000, ante: 300, durationMinutes: 20 },
    { levelIndex: 14, isBreak: false, smallBlind: 1500, bigBlind: 3000, ante: 400, durationMinutes: 20 },
    { levelIndex: 15, isBreak: false, smallBlind: 2000, bigBlind: 4000, ante: 500, durationMinutes: 20 },
  ],
  turbo: [
    { levelIndex: 0, isBreak: false, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 10 },
    { levelIndex: 1, isBreak: false, smallBlind: 50, bigBlind: 100, ante: 0, durationMinutes: 10 },
    { levelIndex: 2, isBreak: false, smallBlind: 100, bigBlind: 200, ante: 25, durationMinutes: 10 },
    { levelIndex: 3, isBreak: true, durationMinutes: 10, label: "Break" },
    { levelIndex: 4, isBreak: false, smallBlind: 150, bigBlind: 300, ante: 25, durationMinutes: 10 },
    { levelIndex: 5, isBreak: false, smallBlind: 200, bigBlind: 400, ante: 50, durationMinutes: 10 },
    { levelIndex: 6, isBreak: false, smallBlind: 300, bigBlind: 600, ante: 75, durationMinutes: 10 },
    { levelIndex: 7, isBreak: false, smallBlind: 400, bigBlind: 800, ante: 100, durationMinutes: 10 },
    { levelIndex: 8, isBreak: false, smallBlind: 600, bigBlind: 1200, ante: 150, durationMinutes: 10 },
    { levelIndex: 9, isBreak: false, smallBlind: 800, bigBlind: 1600, ante: 200, durationMinutes: 10 },
    { levelIndex: 10, isBreak: false, smallBlind: 1000, bigBlind: 2000, ante: 300, durationMinutes: 10 },
    { levelIndex: 11, isBreak: false, smallBlind: 1500, bigBlind: 3000, ante: 400, durationMinutes: 10 },
    { levelIndex: 12, isBreak: false, smallBlind: 2000, bigBlind: 4000, ante: 500, durationMinutes: 10 },
  ],
  deep: [
    { levelIndex: 0, isBreak: false, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 30 },
    { levelIndex: 1, isBreak: false, smallBlind: 50, bigBlind: 100, ante: 0, durationMinutes: 30 },
    { levelIndex: 2, isBreak: false, smallBlind: 75, bigBlind: 150, ante: 0, durationMinutes: 30 },
    { levelIndex: 3, isBreak: false, smallBlind: 100, bigBlind: 200, ante: 0, durationMinutes: 30 },
    { levelIndex: 4, isBreak: true, durationMinutes: 20, label: "Break" },
    { levelIndex: 5, isBreak: false, smallBlind: 150, bigBlind: 300, ante: 25, durationMinutes: 30 },
    { levelIndex: 6, isBreak: false, smallBlind: 200, bigBlind: 400, ante: 25, durationMinutes: 30 },
    { levelIndex: 7, isBreak: false, smallBlind: 250, bigBlind: 500, ante: 50, durationMinutes: 30 },
    { levelIndex: 8, isBreak: false, smallBlind: 300, bigBlind: 600, ante: 75, durationMinutes: 30 },
    { levelIndex: 9, isBreak: true, durationMinutes: 20, label: "Break" },
    { levelIndex: 10, isBreak: false, smallBlind: 400, bigBlind: 800, ante: 100, durationMinutes: 30 },
    { levelIndex: 11, isBreak: false, smallBlind: 500, bigBlind: 1000, ante: 100, durationMinutes: 30 },
    { levelIndex: 12, isBreak: false, smallBlind: 600, bigBlind: 1200, ante: 200, durationMinutes: 30 },
    { levelIndex: 13, isBreak: false, smallBlind: 800, bigBlind: 1600, ante: 200, durationMinutes: 30 },
    { levelIndex: 14, isBreak: false, smallBlind: 1000, bigBlind: 2000, ante: 300, durationMinutes: 30 },
    { levelIndex: 15, isBreak: false, smallBlind: 1500, bigBlind: 3000, ante: 400, durationMinutes: 30 },
    { levelIndex: 16, isBreak: false, smallBlind: 2000, bigBlind: 4000, ante: 500, durationMinutes: 30 },
    { levelIndex: 17, isBreak: false, smallBlind: 3000, bigBlind: 6000, ante: 1000, durationMinutes: 30 },
  ],
  casual: [
    { levelIndex: 0, isBreak: false, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 25 },
    { levelIndex: 1, isBreak: false, smallBlind: 50, bigBlind: 100, ante: 0, durationMinutes: 25 },
    { levelIndex: 2, isBreak: false, smallBlind: 100, bigBlind: 200, ante: 0, durationMinutes: 25 },
    { levelIndex: 3, isBreak: true, durationMinutes: 15, label: "Break" },
    { levelIndex: 4, isBreak: false, smallBlind: 150, bigBlind: 300, ante: 25, durationMinutes: 25 },
    { levelIndex: 5, isBreak: false, smallBlind: 200, bigBlind: 400, ante: 50, durationMinutes: 25 },
    { levelIndex: 6, isBreak: false, smallBlind: 300, bigBlind: 600, ante: 75, durationMinutes: 25 },
    { levelIndex: 7, isBreak: true, durationMinutes: 15, label: "Break" },
    { levelIndex: 8, isBreak: false, smallBlind: 400, bigBlind: 800, ante: 100, durationMinutes: 25 },
    { levelIndex: 9, isBreak: false, smallBlind: 600, bigBlind: 1200, ante: 150, durationMinutes: 25 },
    { levelIndex: 10, isBreak: false, smallBlind: 800, bigBlind: 1600, ante: 200, durationMinutes: 25 },
    { levelIndex: 11, isBreak: false, smallBlind: 1000, bigBlind: 2000, ante: 300, durationMinutes: 25 },
    { levelIndex: 12, isBreak: false, smallBlind: 1500, bigBlind: 3000, ante: 400, durationMinutes: 25 },
  ],
};

export const PRESET_LABELS: Record<PresetName, string> = {
  standard: "Standard (20 min)",
  turbo: "Turbo (10 min)",
  deep: "Deep Stack (30 min)",
  casual: "Casual (25 min)",
};
