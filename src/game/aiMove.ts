import type { Difficulty } from '../tokens';
import { checkWinAt, type Board, type Player } from './checkWin';
import { type AiMove, type DifficultyProfile, DIFFICULTY_PROFILES, candidateMoves, scoreLineForPlayer } from './aiUtils';

interface AiMoveOptions {
  aiPlayer: Player;
  humanPlayer: Player;
  difficulty: Difficulty;
  rng?: () => number;
}

interface ScoredCandidate {
  row: number;
  col: number;
  attackScore: number;
  blockScore: number;
  moveScore: number;
}

function wouldWin(board: Board, row: number, col: number, player: Player): boolean {
  const boardWithMove = board.map(boardRow => boardRow.slice());
  boardWithMove[row][col] = player;
  return checkWinAt(boardWithMove, row, col)?.player === player;
}

function immediateWinningMoves(board: Board, candidates: AiMove[], player: Player): AiMove[] {
  return candidates.filter(([row, col]) => wouldWin(board, row, col, player));
}

function compareCandidates(a: ScoredCandidate, b: ScoredCandidate): number {
  return (
    b.moveScore - a.moveScore ||
    b.attackScore - a.attackScore ||
    b.blockScore - a.blockScore ||
    a.row - b.row ||
    a.col - b.col
  );
}

// Uses rng() twice on the mistake path: once to decide whether to deviate,
// once to pick which alternative. Callers using sequenceRng must budget for both.
function chooseFromProfile(
  candidates: ScoredCandidate[],
  profile: DifficultyProfile,
  rng: () => number,
): AiMove {
  const poolSize = Math.min(profile.candidatePoolSize, candidates.length);
  const shouldPickBest = poolSize <= 1 || rng() >= profile.mistakeChance;
  if (shouldPickBest) return [candidates[0].row, candidates[0].col];

  const alternativeCount = poolSize - 1;
  const alternativeIndex = 1 + Math.floor(rng() * alternativeCount);
  const chosen = candidates[alternativeIndex];
  return [chosen.row, chosen.col];
}

export function aiMove(board: Board, options: AiMoveOptions): AiMove {
  const {
    aiPlayer,
    humanPlayer,
    difficulty,
    rng = Math.random,
  } = options;
  const profile = DIFFICULTY_PROFILES[difficulty];
  const candidates = candidateMoves(board);
  if (!candidates.length) return [Math.floor(board.length / 2), Math.floor(board.length / 2)];

  const aiWins = immediateWinningMoves(board, candidates, aiPlayer);
  if (aiWins.length) return aiWins[0];

  const humanWins = immediateWinningMoves(board, candidates, humanPlayer);
  if (humanWins.length && rng() < profile.blockImmediateWinChance) return humanWins[0];

  const scoredCandidates = candidates.map(([row, col]): ScoredCandidate => {
    const attackScore = scoreLineForPlayer(board, row, col, aiPlayer);
    const blockScore = scoreLineForPlayer(board, row, col, humanPlayer) * profile.defenseWeight;
    const moveScore = Math.max(
      attackScore,
      blockScore,
    ) + rng() * profile.randomJitter;

    return { row, col, attackScore, blockScore, moveScore };
  }).sort(compareCandidates);

  return chooseFromProfile(scoredCandidates, profile, rng);
}
