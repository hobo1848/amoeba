import type { Board, Player } from './checkWin';
import type { Difficulty } from '../tokens';
import { calculateTerritory } from './moyoLogic';

type Move = [number, number];

export function moyoAiMove(
  board: Board,
  difficulty: Difficulty,
  aiPlayer: Player,
  rng = Math.random,
): Move {
  const n = board.length;
  const humanPlayer: Player = aiPlayer === 'O' ? 'X' : 'O';

  const emptyCells: Move[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (!board[r][c]) emptyCells.push([r, c]);

  if (!emptyCells.length) return [Math.floor(n / 2), Math.floor(n / 2)];

  if (difficulty === 'easy') return easyMove(board, emptyCells, rng);
  if (difficulty === 'medium') return mediumMove(board, emptyCells, aiPlayer, rng);
  return hardMove(board, emptyCells, aiPlayer, humanPlayer, rng);
}

function emptyNeighborCount(board: Board, r: number, c: number): number {
  const n = board.length;
  let count = 0;
  for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as [number, number][]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nc >= 0 && nr < n && nc < n && board[nr][nc] === null) count++;
  }
  return count;
}

function easyMove(board: Board, empty: Move[], rng: () => number): Move {
  if (rng() < 0.55) {
    // Bias: prefer cells adjacent to more empty space (region-expansion tendency)
    const sorted = empty.slice().sort(
      (a, b) => emptyNeighborCount(board, b[0], b[1]) - emptyNeighborCount(board, a[0], a[1]),
    );
    const topN = Math.max(1, Math.floor(sorted.length * 0.4));
    return sorted[Math.floor(rng() * topN)];
  }
  return empty[Math.floor(rng() * empty.length)];
}

function territoryScore(board: Board, player: Player): number {
  const t = calculateTerritory(board);
  return player === 'X' ? t.xTerritory : t.oTerritory;
}

function mediumMove(board: Board, empty: Move[], ai: Player, rng: () => number): Move {
  const baseBefore = territoryScore(board, ai);
  let best: Move = empty[0];
  let bestDelta = -Infinity;

  for (const [r, c] of empty) {
    const after = board.map(row => row.slice());
    after[r][c] = ai;
    const delta = territoryScore(after, ai) - baseBefore + rng() * 1.5;
    if (delta > bestDelta) { bestDelta = delta; best = [r, c]; }
  }
  return best;
}

function cornerEdgeBonus(r: number, c: number, n: number): number {
  const corner = (r === 0 || r === n - 1) && (c === 0 || c === n - 1);
  const edge = r === 0 || r === n - 1 || c === 0 || c === n - 1;
  return corner ? 4 : edge ? 2 : 0;
}

function hardMove(board: Board, empty: Move[], ai: Player, human: Player, rng: () => number): Move {
  const n = board.length;

  // First-pass one-ply to get top candidates, then apply two-ply on those
  const baseTerr = calculateTerritory(board);
  const aiBase = ai === 'X' ? baseTerr.xTerritory : baseTerr.oTerritory;

  interface Scored { move: Move; score: number }
  const onePly: Scored[] = empty.map(([r, c]) => {
    const b1 = board.map(row => row.slice());
    b1[r][c] = ai;
    const t1 = calculateTerritory(b1);
    const gain = (ai === 'X' ? t1.xTerritory : t1.oTerritory) - aiBase;
    return { move: [r, c] as Move, score: gain + cornerEdgeBonus(r, c, n) };
  });
  onePly.sort((a, b) => b.score - a.score);

  // Two-ply on top 20 candidates (or all if fewer)
  const candidates = onePly.slice(0, 20);
  let best: Move = candidates[0].move;
  let bestScore = -Infinity;

  for (const { move: [r, c] } of candidates) {
    const b1 = board.map(row => row.slice());
    b1[r][c] = ai;
    const t1 = calculateTerritory(b1);
    const aiAfterMove = ai === 'X' ? t1.xTerritory : t1.oTerritory;

    // Simulate best human response
    const humanEmpty: Move[] = [];
    for (let hr = 0; hr < n; hr++)
      for (let hc = 0; hc < n; hc++)
        if (!b1[hr][hc]) humanEmpty.push([hr, hc]);

    let worstAIAfterHuman = aiAfterMove;
    for (const [hr, hc] of humanEmpty) {
      const b2 = b1.map(row => row.slice());
      b2[hr][hc] = human;
      const t2 = calculateTerritory(b2);
      const aiAfterBoth = ai === 'X' ? t2.xTerritory : t2.oTerritory;
      if (aiAfterBoth < worstAIAfterHuman) worstAIAfterHuman = aiAfterBoth;
    }

    const score = worstAIAfterHuman + cornerEdgeBonus(r, c, n) * 0.5 + rng() * 0.5;
    if (score > bestScore) { bestScore = score; best = [r, c]; }
  }

  return best;
}
