import type { Difficulty } from '../tokens';
import { type Board, type Player } from './checkWin';
import { findCaptures, checkPenteWin, PENTE_WIN_PAIRS } from './pente';
import { type AiMove, DIFFICULTY_PROFILES, candidateMoves, scoreLineForPlayer } from './aiUtils';

export interface PenteAiOptions {
  aiPlayer: Player;
  humanPlayer: Player;
  difficulty: Difficulty;
  pairsAI: number;
  pairsHuman: number;
  rng?: () => number;
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
  if (after >= PENTE_WIN_PAIRS) return 200000;
  // Each pair closer to 5 is more valuable.
  const proximityFactor = 1 + (after / PENTE_WIN_PAIRS) * 3;
  return gained * 600 * proximityFactor;
}

/** Returns true if placing at (row, col) immediately wins for player. */
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
  const b = board.map(r => r.slice());
  b[row][col] = player;
  for (const [cr, cc] of caps) b[cr][cc] = null;
  return !!checkPenteWin(b, row, col, newPairsX, newPairsO);
}

/**
 * 2-ply evaluation for hard mode. Scores the board from `aiPlayer`'s
 * perspective after a move has already been applied, by checking the
 * best response `humanPlayer` could make.
 */
function twoPlyCaptureEval(
  board: Board,
  aiPlayer: Player,
  humanPlayer: Player,
  pairsAI: number,
  pairsHuman: number,
): number {
  const candidates = candidateMoves(board).slice(0, 8);
  let best = -Infinity;
  for (const [r, c] of candidates) {
    if (board[r][c]) continue;
    const pairsX = aiPlayer === 'X' ? pairsAI : pairsHuman;
    const pairsO = aiPlayer === 'O' ? pairsAI : pairsHuman;
    const lineScore = scoreLineForPlayer(board, r, c, aiPlayer);
    const capScore = scoreCapture(board, r, c, aiPlayer, pairsAI);
    const blockScore = scoreLineForPlayer(board, r, c, humanPlayer) +
      scoreCapture(board, r, c, humanPlayer, pairsHuman);
    if (winsNow(board, r, c, aiPlayer, pairsX, pairsO)) return 500000;
    best = Math.max(best, lineScore + capScore - blockScore * 0.8);
  }
  return best === -Infinity ? 0 : best;
}

export function penteAiMove(board: Board, options: PenteAiOptions): AiMove {
  const {
    aiPlayer, humanPlayer, difficulty,
    pairsAI, pairsHuman,
    rng = Math.random,
  } = options;

  const profile = DIFFICULTY_PROFILES[difficulty];
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
    const lineAtk = scoreLineForPlayer(board, r, c, aiPlayer);
    const capAtk = scoreCapture(board, r, c, aiPlayer, pairsAI);
    const lineDef = scoreLineForPlayer(board, r, c, humanPlayer) * profile.defenseWeight;
    const capDef = scoreCapture(board, r, c, humanPlayer, pairsHuman) * profile.defenseWeight;

    let moveScore = Math.max(lineAtk + capAtk, lineDef + capDef) + rng() * profile.randomJitter;

    // Hard: 2-ply look-ahead for top candidates
    if (difficulty === 'hard') {
      const b2 = board.map(r2 => r2.slice());
      const caps = findCaptures(b2, r, c, aiPlayer);
      b2[r][c] = aiPlayer;
      for (const [cr, cc] of caps) b2[cr][cc] = null;
      const newPairsAI = pairsAI + caps.length / 2;
      // Evaluate from the human's perspective to measure what we'd be giving them.
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
