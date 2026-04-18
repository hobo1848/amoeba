import type { Board, Player } from './checkWin';

function scoreForPlayer(board: Board, r: number, c: number, p: Player): number {
  const n = board.length;
  const dirs: [number, number][] = [[0,1],[1,0],[1,1],[1,-1]];
  let score = 0;
  for (const [dr, dc] of dirs) {
    let count = 1, openA = false, openB = false;
    for (let k = 1; k < 5; k++) {
      const rr = r + dr*k, cc = c + dc*k;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) break;
      if (board[rr][cc] === p) count++;
      else { if (board[rr][cc] === null) openA = true; break; }
    }
    for (let k = 1; k < 5; k++) {
      const rr = r - dr*k, cc = c - dc*k;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) break;
      if (board[rr][cc] === p) count++;
      else { if (board[rr][cc] === null) openB = true; break; }
    }
    const opens = (openA ? 1 : 0) + (openB ? 1 : 0);
    if (count >= 5)                      score += 100000;
    else if (count === 4 && opens === 2) score += 10000;
    else if (count === 4 && opens === 1) score += 1000;
    else if (count === 3 && opens === 2) score += 500;
    else if (count === 3 && opens === 1) score += 80;
    else if (count === 2 && opens === 2) score += 40;
    else if (count === 2 && opens === 1) score += 8;
    else                                  score += 1;
  }
  return score;
}

export function aiMove(board: Board, me: Player, opp: Player): [number, number] {
  const n = board.length;
  const occ: [number, number][] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (board[r][c]) occ.push([r, c]);

  if (!occ.length) return [Math.floor(n / 2), Math.floor(n / 2)];

  const cellSet = new Set<number>();
  for (const [r, c] of occ) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < n && cc < n && !board[rr][cc])
          cellSet.add(rr * n + cc);
      }
    }
  }

  let best: [number, number] | null = null;
  let bestScore = -1;
  for (const key of cellSet) {
    const r = Math.floor(key / n), c = key % n;
    const s = Math.max(
      scoreForPlayer(board, r, c, me),
      scoreForPlayer(board, r, c, opp) * 0.9,
    ) + Math.random() * 2;
    if (s > bestScore) { bestScore = s; best = [r, c]; }
  }
  return best ?? [Math.floor(n / 2), Math.floor(n / 2)];
}
