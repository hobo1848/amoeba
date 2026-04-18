export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[][];

export interface WinResult {
  player: Player;
  line: { r: number; c: number }[];
}

export function checkWinAt(board: Board, r: number, c: number): WinResult | null {
  const n = board.length;
  const p = board[r][c];
  if (!p) return null;
  const dirs: [number, number][] = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    const line: { r: number; c: number }[] = [{ r, c }];
    for (let k = 1; k < 5; k++) {
      const rr = r + dr*k, cc = c + dc*k;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n || board[rr][cc] !== p) break;
      line.push({ r: rr, c: cc });
    }
    for (let k = 1; k < 5; k++) {
      const rr = r - dr*k, cc = c - dc*k;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n || board[rr][cc] !== p) break;
      line.unshift({ r: rr, c: cc });
    }
    if (line.length >= 5) return { player: p as Player, line: line.slice(0, 5) };
  }
  return null;
}

export function emptyBoard(n: number): Board {
  return Array.from({ length: n }, () => Array(n).fill(null));
}
