import type { Board, Player } from './checkWin';
import type { TerritoryResult } from './moyoLogic';

export interface MoyoPatternCounts {
  cornersSecured: { X: number; O: number };
  walls: { X: number; O: number };
  invasions: { X: number; O: number };
  weakGroups: { X: number; O: number };
}

const DIRS4: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const DIRS8: [number, number][] = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
const WALL_DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];

export function detectMoyoPatterns(board: Board, territory: TerritoryResult): MoyoPatternCounts {
  const n = board.length;

  // ── Corners secured ───────────────────────────────────────────────────────
  // Count corners whose empty cell territory is owned by each player
  const cornersSecured = { X: 0, O: 0 };
  for (const [cr, cc] of [[0, 0], [0, n - 1], [n - 1, 0], [n - 1, n - 1]] as [number, number][]) {
    const owner = territory.cells[cr][cc];
    if (owner === 'X') cornersSecured.X++;
    else if (owner === 'O') cornersSecured.O++;
  }

  // ── Walls: runs of 3+ same-color stones in any line direction ─────────────
  const walls = { X: 0, O: 0 };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const p = board[r][c] as Player | null;
      if (!p) continue;
      for (const [dr, dc] of WALL_DIRS) {
        // Only count from the start of each run (no preceding same-color stone)
        const pr = r - dr, pc = c - dc;
        if (pr >= 0 && pc >= 0 && pr < n && pc < n && board[pr][pc] === p) continue;
        let len = 1;
        while (true) {
          const nr = r + dr * len, nc = c + dc * len;
          if (nr < 0 || nc < 0 || nr >= n || nc >= n || board[nr][nc] !== p) break;
          len++;
        }
        if (len >= 3) {
          if (p === 'X') walls.X++;
          else walls.O++;
        }
      }
    }
  }

  // ── Invasions: stones inside a region the opponent's stones dominate ───────
  // A stone is an invasion if ≥2 neighbors are opponent stones and more
  // opponent neighbors than friendly neighbors
  const invasions = { X: 0, O: 0 };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const p = board[r][c] as Player | null;
      if (!p) continue;
      const opp: Player = p === 'X' ? 'O' : 'X';
      let oppN = 0, sameN = 0;
      for (const [dr, dc] of DIRS4) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < n && nc < n) {
          if (board[nr][nc] === opp) oppN++;
          else if (board[nr][nc] === p) sameN++;
        }
      }
      if (oppN >= 2 && oppN > sameN) {
        if (p === 'X') invasions.X++;
        else invasions.O++;
      }
    }
  }

  // ── Weak groups: stones with ≤1 same-color neighbor (8-connected) ─────────
  const weakGroups = { X: 0, O: 0 };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const p = board[r][c] as Player | null;
      if (!p) continue;
      let sameN = 0;
      for (const [dr, dc] of DIRS8) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < n && nc < n && board[nr][nc] === p) sameN++;
      }
      if (sameN <= 1) {
        if (p === 'X') weakGroups.X++;
        else weakGroups.O++;
      }
    }
  }

  return { cornersSecured, walls, invasions, weakGroups };
}
