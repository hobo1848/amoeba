import type { Board, Player } from './checkWin';
import type { Difficulty } from '../tokens';

export type TerritoryOwner = 'X' | 'O' | 'neutral' | 'contested';

export interface TerritoryResult {
  cells: TerritoryOwner[][];
  xTerritory: number;
  oTerritory: number;
  neutral: number;
  contested: number;
}

export const MOYO_MOVES_PER_SIDE = 15;

export function moyoBoardSize(difficulty: Difficulty): number {
  return difficulty === 'easy' ? 7 : difficulty === 'medium' ? 9 : 11;
}

export function calculateTerritory(board: Board): TerritoryResult {
  const n = board.length;
  const ownership: TerritoryOwner[][] = Array.from({ length: n }, () =>
    Array(n).fill('neutral' as TerritoryOwner),
  );
  const visited = Array.from({ length: n }, () => Array(n).fill(false));

  let xTerritory = 0, oTerritory = 0, neutral = 0, contested = 0;

  for (let startR = 0; startR < n; startR++) {
    for (let startC = 0; startC < n; startC++) {
      if (board[startR][startC] !== null || visited[startR][startC]) continue;

      // BFS to find connected empty region
      const region: [number, number][] = [];
      const queue: [number, number][] = [[startR, startC]];
      visited[startR][startC] = true;
      let hasX = false, hasO = false;

      while (queue.length) {
        const item = queue.shift()!;
        const [r, c] = item;
        region.push([r, c]);

        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as [number, number][]) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
          const cell = board[nr][nc];
          if (cell === null) {
            if (!visited[nr][nc]) {
              visited[nr][nc] = true;
              queue.push([nr, nc]);
            }
          } else if (cell === 'X') {
            hasX = true;
          } else if (cell === 'O') {
            hasO = true;
          }
        }
      }

      let owner: TerritoryOwner;
      if (hasX && !hasO) owner = 'X';
      else if (hasO && !hasX) owner = 'O';
      else if (hasX && hasO) owner = 'contested';
      else owner = 'neutral';

      for (const [r, c] of region) {
        ownership[r][c] = owner;
        if (owner === 'X') xTerritory++;
        else if (owner === 'O') oTerritory++;
        else if (owner === 'contested') contested++;
        else neutral++;
      }
    }
  }

  return { cells: ownership, xTerritory, oTerritory, neutral, contested };
}

export function moyoWinner(territory: TerritoryResult): Player | 'draw' {
  if (territory.xTerritory > territory.oTerritory) return 'X';
  if (territory.oTerritory > territory.xTerritory) return 'O';
  return 'draw';
}
