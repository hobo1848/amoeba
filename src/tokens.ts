export type AestheticKey = 'a' | 'b' | 'c';

export interface Aesthetic {
  key: AestheticKey;
  name: string;
  inkName: string;
  paper: string;
  grid: string;
  gridOpacity: number;
  x: string;
  o: string;
  ui: string;
  muted: string;
  winLoop: string;
  winStrike: string;
}

export const AESTHETICS: Record<AestheticKey, Aesthetic> = {
  a: {
    key: 'a', name: 'Graphite on cream', inkName: 'Pencil',
    paper: '#f4eedb', grid: '#c9b492', gridOpacity: 0.70,
    x: '#2a2420', o: '#2a2420', ui: '#2a2420',
    muted: 'rgba(42,36,32,0.55)', winLoop: '#b33a2a', winStrike: '#2a2420',
  },
  b: {
    key: 'b', name: 'Blue ballpoint on white', inkName: 'Ballpoint',
    paper: '#fbfcfb', grid: '#b9c7d6', gridOpacity: 0.85,
    x: '#1e4a8f', o: '#1e4a8f', ui: '#1e4a8f',
    muted: 'rgba(30,74,143,0.55)', winLoop: '#c23a2a', winStrike: '#1e4a8f',
  },
  c: {
    key: 'c', name: 'Two-colour pencil', inkName: 'Color pencil',
    paper: '#f4eedb', grid: '#c9b492', gridOpacity: 0.70,
    x: '#b52a2a', o: '#2a4a8f', ui: '#2a2420',
    muted: 'rgba(42,36,32,0.55)', winLoop: '#b52a2a', winStrike: '#2a2420',
  },
};

export const TIMINGS = {
  markDrawMs: 220,
  markStaggerMs: 100,
  aiDelayMs: {
    easy: [350, 650] as [number, number],
    medium: [500, 900] as [number, number],
    hard: [700, 1200] as [number, number],
  },
  winDrawMs: 900,
} as const;

export const STROKE = { mark: 2.1, win: 2.6, grid: 0.7, border: 1.2 } as const;
export const BOARD = {
  target: 600,
  cellPx: (n: number) => Math.floor(600 / n),
  pad: 28,
} as const;

export const GRID_SIZES = [13, 15, 19] as const;
export type GridSize = typeof GRID_SIZES[number];

export type Difficulty = 'easy' | 'medium' | 'hard';
