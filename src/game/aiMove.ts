import type { Difficulty } from '../tokens';
import { checkWinAt, type Board, type Player } from './checkWin';

type Move = [row: number, col: number];

interface AiMoveOptions {
  aiPlayer: Player;
  humanPlayer: Player;
  difficulty: Difficulty;
  rng?: () => number;
}

interface DifficultyProfile {
  defenseWeight: number;
  randomJitter: number;
  mistakeChance: number;
  candidatePoolSize: number;
  blockImmediateWinChance: number;
}

interface ScoredCandidate {
  row: number;
  col: number;
  attackScore: number;
  blockScore: number;
  moveScore: number;
}

const AI_DIFFICULTY: Record<Difficulty, DifficultyProfile> = {
  easy: {
    defenseWeight: 0.65,
    randomJitter: 60,
    mistakeChance: 0.65,
    candidatePoolSize: 6,
    blockImmediateWinChance: 0.35,
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

function candidateMoves(board: Board): Move[] {
  const boardSize = board.length;
  const occupiedCells: Move[] = [];
  for (let row = 0; row < boardSize; row++)
    for (let col = 0; col < boardSize; col++)
      if (board[row][col]) occupiedCells.push([row, col]);

  if (!occupiedCells.length) return [[Math.floor(boardSize / 2), Math.floor(boardSize / 2)]];

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

  return Array.from(candidateCells, key => [
    Math.floor(key / boardSize),
    key % boardSize,
  ] as Move);
}

function wouldWin(board: Board, row: number, col: number, player: Player): boolean {
  const boardWithMove = board.map(boardRow => boardRow.slice());
  boardWithMove[row][col] = player;
  return checkWinAt(boardWithMove, row, col)?.player === player;
}

function immediateWinningMoves(board: Board, candidates: Move[], player: Player): Move[] {
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

function chooseFromProfile(
  candidates: ScoredCandidate[],
  profile: DifficultyProfile,
  rng: () => number,
): Move {
  const poolSize = Math.min(profile.candidatePoolSize, candidates.length);
  const shouldPickBest = poolSize <= 1 || rng() >= profile.mistakeChance;
  if (shouldPickBest) return [candidates[0].row, candidates[0].col];

  const alternativeCount = poolSize - 1;
  const alternativeIndex = 1 + Math.floor(rng() * alternativeCount);
  const chosen = candidates[alternativeIndex];
  return [chosen.row, chosen.col];
}

export function aiMove(board: Board, options: AiMoveOptions): Move {
  const {
    aiPlayer,
    humanPlayer,
    difficulty,
    rng = Math.random,
  } = options;
  const profile = AI_DIFFICULTY[difficulty];
  const candidates = candidateMoves(board);

  const aiWins = immediateWinningMoves(board, candidates, aiPlayer);
  if (aiWins.length) return aiWins[0];

  const humanWins = immediateWinningMoves(board, candidates, humanPlayer);
  if (humanWins.length && rng() < profile.blockImmediateWinChance) return humanWins[0];

  const scoredCandidates = candidates.map(([row, col]): ScoredCandidate => {
    const attackScore = scoreCellForPlayer(board, row, col, aiPlayer);
    const blockScore = scoreCellForPlayer(board, row, col, humanPlayer) * profile.defenseWeight;
    const moveScore = Math.max(
      attackScore,
      blockScore,
    ) + rng() * profile.randomJitter;

    return { row, col, attackScore, blockScore, moveScore };
  }).sort(compareCandidates);

  return chooseFromProfile(scoredCandidates, profile, rng);
}
