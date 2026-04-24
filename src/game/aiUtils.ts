import type { Difficulty } from '../tokens';
import type { Board, Player } from './checkWin';

export type AiMove = [row: number, col: number];

export interface DifficultyProfile {
  defenseWeight: number;
  randomJitter: number;
  mistakeChance: number;
  candidatePoolSize: number;
  blockImmediateWinChance: number;
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: {
    defenseWeight: 0.75,
    randomJitter: 22,
    mistakeChance: 0.38,
    candidatePoolSize: 4,
    blockImmediateWinChance: 0.55,
  },
  medium: {
    defenseWeight: 0.9,
    randomJitter: 5,
    mistakeChance: 0.15,
    candidatePoolSize: 3,
    blockImmediateWinChance: 0.85,
  },
  hard: {
    defenseWeight: 1,
    randomJitter: 0.25,
    mistakeChance: 0,
    candidatePoolSize: 1,
    blockImmediateWinChance: 1,
  },
};

const AXIS_DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];

/**
 * Score line-building potential for `player` placing at (row, col).
 *
 * Scoring scale per axis (stone count × open ends):
 *   5+         → 100 000  (win)
 *   4 + 2 open → 10 000   (double-open four — unstoppable)
 *   4 + 1 open → 1 000
 *   3 + 2 open → 500
 *   3 + 1 open → 80
 *   2 + 2 open → 40
 *   2 + 1 open → 8
 *   other      → 1
 */
export function scoreLineForPlayer(board: Board, row: number, col: number, player: Player): number {
  const n = board.length;
  let score = 0;

  for (const [dr, dc] of AXIS_DIRS) {
    let count = 1;
    let openF = false, openB = false;

    for (let d = 1; d < 5; d++) {
      const nr = row + dr * d, nc = col + dc * d;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n) break;
      if (board[nr][nc] === player) count++;
      else { openF = board[nr][nc] === null; break; }
    }
    for (let d = 1; d < 5; d++) {
      const nr = row - dr * d, nc = col - dc * d;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n) break;
      if (board[nr][nc] === player) count++;
      else { openB = board[nr][nc] === null; break; }
    }

    const open = (openF ? 1 : 0) + (openB ? 1 : 0);
    if (count >= 5)                     score += 100000;
    else if (count === 4 && open === 2) score += 10000;
    else if (count === 4 && open === 1) score += 1000;
    else if (count === 3 && open === 2) score += 500;
    else if (count === 3 && open === 1) score += 80;
    else if (count === 2 && open === 2) score += 40;
    else if (count === 2 && open === 1) score += 8;
    else                                score += 1;
  }
  return score;
}

/**
 * Empty cells within ±2 of any occupied cell — the only useful candidates
 * in normal 5-in-a-row play. Returns the center on an empty board.
 *
 * The packed numeric key (row * n + col) lets the Set deduplicate cells
 * from overlapping 5×5 neighborhoods without allocating objects.
 */
export function candidateMoves(board: Board): AiMove[] {
  const n = board.length;
  const occupied: AiMove[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (board[r][c]) occupied.push([r, c]);

  if (!occupied.length) return [[Math.floor(n / 2), Math.floor(n / 2)]];

  const seen = new Set<number>();
  for (const [r, c] of occupied) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < n && nc < n && !board[nr][nc])
          seen.add(nr * n + nc);
      }
    }
  }
  return Array.from(seen, k => [Math.floor(k / n), k % n] as AiMove);
}
