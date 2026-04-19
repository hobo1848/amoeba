import type { Board, Player } from './checkWin';

function scoreCellForPlayer(board: Board, row: number, col: number, player: Player): number {
  const boardSize = board.length;
  const directions: [rowStep: number, colStep: number][] = [[0,1],[1,0],[1,1],[1,-1]];
  let score = 0;

  for (const [rowStep, colStep] of directions) {
    let connectedStones = 1;
    let openForwardEnd = false;
    let openBackwardEnd = false;

    // Pretend the candidate cell contains `player`, then count contiguous
    // stones outward in both directions along this axis.
    for (let distance = 1; distance < 5; distance++) {
      const nextRow = row + rowStep * distance;
      const nextCol = col + colStep * distance;
      if (nextRow < 0 || nextCol < 0 || nextRow >= boardSize || nextCol >= boardSize) break;
      if (board[nextRow][nextCol] === player) {
        connectedStones++;
      } else {
        if (board[nextRow][nextCol] === null) openForwardEnd = true;
        break;
      }
    }

    for (let distance = 1; distance < 5; distance++) {
      const nextRow = row - rowStep * distance;
      const nextCol = col - colStep * distance;
      if (nextRow < 0 || nextCol < 0 || nextRow >= boardSize || nextCol >= boardSize) break;
      if (board[nextRow][nextCol] === player) {
        connectedStones++;
      } else {
        if (board[nextRow][nextCol] === null) openBackwardEnd = true;
        break;
      }
    }

    const openEnds = (openForwardEnd ? 1 : 0) + (openBackwardEnd ? 1 : 0);
    if (connectedStones >= 5)                          score += 100000;
    else if (connectedStones === 4 && openEnds === 2)  score += 10000;
    else if (connectedStones === 4 && openEnds === 1)  score += 1000;
    else if (connectedStones === 3 && openEnds === 2)  score += 500;
    else if (connectedStones === 3 && openEnds === 1)  score += 80;
    else if (connectedStones === 2 && openEnds === 2)  score += 40;
    else if (connectedStones === 2 && openEnds === 1)  score += 8;
    else                                                score += 1;
  }
  return score;
}

export function aiMove(board: Board, aiPlayer: Player, humanPlayer: Player): [row: number, col: number] {
  const boardSize = board.length;
  const occupiedCells: [row: number, col: number][] = [];
  for (let row = 0; row < boardSize; row++)
    for (let col = 0; col < boardSize; col++)
      if (board[row][col]) occupiedCells.push([row, col]);

  if (!occupiedCells.length) return [Math.floor(boardSize / 2), Math.floor(boardSize / 2)];

  // Nearby empty cells are the only useful candidates in normal Gomoku play.
  // The packed numeric key lets the Set deduplicate cells from overlapping
  // 5x5 neighborhoods without allocating `{ row, col }` objects.
  const candidateCells = new Set<number>();
  for (const [row, col] of occupiedCells) {
    for (let rowOffset = -2; rowOffset <= 2; rowOffset++) {
      for (let colOffset = -2; colOffset <= 2; colOffset++) {
        const candidateRow = row + rowOffset;
        const candidateCol = col + colOffset;
        if (
          candidateRow >= 0 &&
          candidateCol >= 0 &&
          candidateRow < boardSize &&
          candidateCol < boardSize &&
          !board[candidateRow][candidateCol]
        ) {
          candidateCells.add(candidateRow * boardSize + candidateCol);
        }
      }
    }
  }

  let bestMove: [row: number, col: number] | null = null;
  let bestScore = -1;

  for (const key of candidateCells) {
    const row = Math.floor(key / boardSize);
    const col = key % boardSize;
    const attackScore = scoreCellForPlayer(board, row, col, aiPlayer);
    const blockScore = scoreCellForPlayer(board, row, col, humanPlayer) * 0.9;
    const moveScore = Math.max(
      attackScore,
      blockScore,
    ) + Math.random() * 2;
    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMove = [row, col];
    }
  }

  return bestMove ?? [Math.floor(boardSize / 2), Math.floor(boardSize / 2)];
}
