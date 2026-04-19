export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[][];

export interface WinResult {
  player: Player;
  line: { row: number; col: number }[];
}

export function checkWinAt(board: Board, row: number, col: number): WinResult | null {
  const boardSize = board.length;
  const player = board[row][col];
  if (!player) return null;

  // A fresh win can only pass through the newest stone, so checking these
  // four axes is enough: horizontal, vertical, and the two diagonals.
  const directions: [rowStep: number, colStep: number][] = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [rowStep, colStep] of directions) {
    const line: { row: number; col: number }[] = [{ row, col }];

    for (let distance = 1; distance < 5; distance++) {
      const nextRow = row + rowStep * distance;
      const nextCol = col + colStep * distance;
      if (
        nextRow < 0 ||
        nextCol < 0 ||
        nextRow >= boardSize ||
        nextCol >= boardSize ||
        board[nextRow][nextCol] !== player
      ) break;
      line.push({ row: nextRow, col: nextCol });
    }

    for (let distance = 1; distance < 5; distance++) {
      const nextRow = row - rowStep * distance;
      const nextCol = col - colStep * distance;
      if (
        nextRow < 0 ||
        nextCol < 0 ||
        nextRow >= boardSize ||
        nextCol >= boardSize ||
        board[nextRow][nextCol] !== player
      ) break;
      line.unshift({ row: nextRow, col: nextCol });
    }

    if (line.length >= 5) return { player, line: line.slice(0, 5) };
  }
  return null;
}

export function emptyBoard(boardSize: number): Board {
  return Array.from({ length: boardSize }, () => Array(boardSize).fill(null));
}
