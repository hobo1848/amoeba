import type { Difficulty } from '../tokens';
import { type Board, type Player } from './checkWin';
import { findCaptures, checkPenteWin, PENTE_WIN_PAIRS } from './pente';

type Move = [row: number, col: number];

export interface PenteAiOptions {
  aiPlayer: Player;
  humanPlayer: Player;
  difficulty: Difficulty;
  pairsAI: number;
  pairsHuman: number;
  rng?: () => number;
}

interface DifficultyProfile {
  defenseWeight: number;
  randomJitter: number;
  mistakeChance: number;
  candidatePoolSize: number;
  blockImmediateWinChance: number;
}

const PROFILES: Record<Difficulty, DifficultyProfile> = {
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

function candidateMoves(board: Board): Move[] {
  const n = board.length;
  const occupied: Move[] = [];
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
  return Array.from(seen, k => [Math.floor(k / n), k % n] as Move);
}

/** Mirror of Gomoku scoreCellForPlayer — scores line-building potential. */
function scoreLine(board: Board, row: number, col: number, player: Player): number {
  const n = board.length;
  const dirs: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];
  let score = 0;

  for (const [dr, dc] of dirs) {
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
 * Score the capture value of placing `player` at (row, col).
 * `currentPairs` is the player's pair count BEFORE this move.
 * Scores are weighted by proximity to the 5-pair win threshold.
 */
function scoreCapture(
  board: Board,
  row: number,
  col: number,
  player: Player,
  currentPairs: number,
): number {
  const captured = findCaptures(board, row, col, player);
  if (!captured.length) return 0;
  const gained = captured.length / 2;
  const after = currentPairs + gained;
  if (after >= PENTE_WIN_PAIRS) return 200000; // capture win
  // Proximity weighting: each pair closer to 5 is more valuable
  const proximityFactor = 1 + (after / PENTE_WIN_PAIRS) * 3;
  return gained * 600 * proximityFactor;
}

/** Returns true if placing at (row,col) immediately wins for player. */
function winsNow(
  board: Board,
  row: number,
  col: number,
  player: Player,
  pairsX: number,
  pairsO: number,
): boolean {
  const caps = findCaptures(board, row, col, player);
  const newPairsX = pairsX + (player === 'X' ? caps.length / 2 : 0);
  const newPairsO = pairsO + (player === 'O' ? caps.length / 2 : 0);
  // Apply captures to a copy for line-win check
  const b = board.map(r => r.slice());
  b[row][col] = player;
  for (const [cr, cc] of caps) b[cr][cc] = null;
  return !!checkPenteWin(b, row, col, newPairsX, newPairsO);
}

/** 2-ply evaluation for hard mode. Returns a score from the AI's perspective. */
function twoPlyCaptureEval(
  board: Board,
  aiPlayer: Player,
  humanPlayer: Player,
  pairsAI: number,
  pairsHuman: number,
): number {
  // Score the board state after a move has been applied
  const candidates = candidateMoves(board).slice(0, 8);
  let best = -Infinity;
  for (const [r, c] of candidates) {
    if (board[r][c]) continue;
    const pairsX = aiPlayer === 'X' ? pairsAI : pairsHuman;
    const pairsO = aiPlayer === 'O' ? pairsAI : pairsHuman;
    const lineScore = scoreLine(board, r, c, aiPlayer);
    const capScore = scoreCapture(board, r, c, aiPlayer, pairsAI);
    const blockScore = scoreLine(board, r, c, humanPlayer) +
      scoreCapture(board, r, c, humanPlayer, pairsHuman);
    if (winsNow(board, r, c, aiPlayer, pairsX, pairsO)) return 500000;
    best = Math.max(best, lineScore + capScore - blockScore * 0.8);
  }
  return best === -Infinity ? 0 : best;
}

export function penteAiMove(board: Board, options: PenteAiOptions): Move {
  const {
    aiPlayer, humanPlayer, difficulty,
    pairsAI, pairsHuman,
    rng = Math.random,
  } = options;

  const profile = PROFILES[difficulty];
  const candidates = candidateMoves(board);
  if (!candidates.length) {
    const mid = Math.floor(board.length / 2);
    return [mid, mid];
  }

  const pairsX = aiPlayer === 'X' ? pairsAI : pairsHuman;
  const pairsO = aiPlayer === 'O' ? pairsAI : pairsHuman;

  // 1. AI immediate win (line or captures)
  for (const [r, c] of candidates) {
    if (winsNow(board, r, c, aiPlayer, pairsX, pairsO)) return [r, c];
  }

  // 2. Block human immediate win
  if (rng() < profile.blockImmediateWinChance) {
    const hpairsX = humanPlayer === 'X' ? pairsHuman : pairsAI;
    const hpairsO = humanPlayer === 'O' ? pairsHuman : pairsAI;
    for (const [r, c] of candidates) {
      if (winsNow(board, r, c, humanPlayer, hpairsX, hpairsO)) return [r, c];
    }
  }

  // 3. Score all candidates
  const scored = candidates.map(([r, c]) => {
    const lineAtk = scoreLine(board, r, c, aiPlayer);
    const capAtk = scoreCapture(board, r, c, aiPlayer, pairsAI);
    const lineDef = scoreLine(board, r, c, humanPlayer) * profile.defenseWeight;
    const capDef = scoreCapture(board, r, c, humanPlayer, pairsHuman) * profile.defenseWeight;

    let moveScore = Math.max(lineAtk + capAtk, lineDef + capDef) + rng() * profile.randomJitter;

    // Hard: 2-ply look-ahead for top candidates
    if (difficulty === 'hard') {
      const b2 = board.map(r2 => r2.slice());
      const caps = findCaptures(b2, r, c, aiPlayer);
      b2[r][c] = aiPlayer;
      for (const [cr, cc] of caps) b2[cr][cc] = null;
      const newPairsAI = pairsAI + caps.length / 2;
      const lookahead = twoPlyCaptureEval(b2, humanPlayer, aiPlayer, pairsHuman, newPairsAI);
      moveScore += lineAtk + capAtk - lookahead * 0.6;
    }

    return { r, c, moveScore };
  }).sort((a, b) => b.moveScore - a.moveScore);

  const poolSize = Math.min(profile.candidatePoolSize, scored.length);
  if (poolSize <= 1 || rng() >= profile.mistakeChance) {
    return [scored[0].r, scored[0].c];
  }
  const idx = 1 + Math.floor(rng() * (poolSize - 1));
  return [scored[idx].r, scored[idx].c];
}
