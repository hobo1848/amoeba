import { type Board, type Player, checkWinAt } from './checkWin';

export type PenteWinType = 'line' | 'captures';

export interface PenteWin {
  player: Player;
  type: PenteWinType;
  line?: { row: number; col: number }[];
}

export const PENTE_WIN_PAIRS = 5;

const DIRS8: [number, number][] = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
  [1, 1], [-1, -1], [1, -1], [-1, 1],
];

const AXIS_DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];

function inBounds(n: number, r: number, c: number): boolean {
  return r >= 0 && c >= 0 && r < n && c < n;
}

/**
 * Find cells captured by placing `player` at (row, col).
 * Call BEFORE placing the stone on the board.
 */
export function findCaptures(
  board: Board,
  row: number,
  col: number,
  player: Player,
): [number, number][] {
  const n = board.length;
  const opp: Player = player === 'X' ? 'O' : 'X';
  const captured: [number, number][] = [];

  for (const [dr, dc] of DIRS8) {
    const r1 = row + dr, c1 = col + dc;
    const r2 = row + 2 * dr, c2 = col + 2 * dc;
    const r3 = row + 3 * dr, c3 = col + 3 * dc;
    if (!inBounds(n, r1, c1) || !inBounds(n, r2, c2) || !inBounds(n, r3, c3)) continue;
    if (board[r1][c1] === opp && board[r2][c2] === opp && board[r3][c3] === player) {
      captured.push([r1, c1], [r2, c2]);
    }
  }
  return captured;
}

/**
 * Check for a Pente win after placing. Call AFTER placing the stone.
 * Capture counts must already be updated to the post-move values.
 */
export function checkPenteWin(
  board: Board,
  row: number,
  col: number,
  pairsX: number,
  pairsO: number,
): PenteWin | null {
  const player = board[row][col] as Player | null;
  if (!player) return null;

  const pairs = player === 'X' ? pairsX : pairsO;
  if (pairs >= PENTE_WIN_PAIRS) return { player, type: 'captures' };

  const lineWin = checkWinAt(board, row, col);
  if (lineWin) return { player, type: 'line', line: lineWin.line };

  return null;
}

/** Cells where placing `player` would result in at least one capture. */
export interface ThreatCells {
  count: number;
  cells: { row: number; col: number }[];
}

export function countThreats(board: Board, player: Player): ThreatCells {
  const n = board.length;
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] !== null) continue;
      if (findCaptures(board, r, c, player).length > 0) cells.push({ row: r, col: c });
    }
  }
  return { count: cells.length, cells };
}

/** A pair of `player` stones that can be captured on the opponent's very next move. */
export interface VulnerablePair {
  player: Player;
  cells: [{ row: number; col: number }, { row: number; col: number }];
  captureCell: { row: number; col: number };
}

export function findVulnerablePairs(board: Board, player: Player): VulnerablePair[] {
  const n = board.length;
  const opp: Player = player === 'X' ? 'O' : 'X';
  const result: VulnerablePair[] = [];
  const seen = new Set<string>();

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] !== player) continue;
      for (const [dr, dc] of AXIS_DIRS) {
        const r2 = r + dr, c2 = c + dc;
        if (!inBounds(n, r2, c2) || board[r2][c2] !== player) continue;

        const key = `${r},${c},${dr},${dc}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const rBefore = r - dr, cBefore = c - dc;
        const rAfter = r2 + dr, cAfter = c2 + dc;

        if (!inBounds(n, rBefore, cBefore) || !inBounds(n, rAfter, cAfter)) continue;

        // opp already at one end, empty at other → opp can complete capture
        if (board[rBefore][cBefore] === opp && board[rAfter][cAfter] === null) {
          result.push({
            player,
            cells: [{ row: r, col: c }, { row: r2, col: c2 }],
            captureCell: { row: rAfter, col: cAfter },
          });
        } else if (board[rAfter][cAfter] === opp && board[rBefore][cBefore] === null) {
          result.push({
            player,
            cells: [{ row: r, col: c }, { row: r2, col: c2 }],
            captureCell: { row: rBefore, col: cBefore },
          });
        }
      }
    }
  }
  return result;
}
