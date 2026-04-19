import { describe, expect, it } from 'vitest';
import { aiMove } from './aiMove';
import { emptyBoard, type Board, type Player } from './checkWin';

function boardWithMoves(size: number, moves: Array<[row: number, col: number, player: Player]>): Board {
  const board = emptyBoard(size);
  moves.forEach(([row, col, player]) => {
    board[row][col] = player;
  });
  return board;
}

function repeatingRng(value: number): () => number {
  return () => value;
}

function sequenceRng(values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1] ?? 0;
}

describe('aiMove', () => {
  it('plays the center on an empty board', () => {
    expect(aiMove(emptyBoard(15), {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'hard',
      rng: repeatingRng(0),
    })).toEqual([7, 7]);
  });

  it('takes an immediate winning move on every difficulty', () => {
    const board = boardWithMoves(15, [
      [7, 3, 'O'],
      [7, 4, 'O'],
      [7, 5, 'O'],
      [7, 6, 'O'],
      [4, 4, 'X'],
    ]);

    expect(aiMove(board, {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'easy',
      rng: repeatingRng(0.99),
    })).toEqual([7, 2]);
    expect(aiMove(board, {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'medium',
      rng: repeatingRng(0.99),
    })).toEqual([7, 2]);
    expect(aiMove(board, {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'hard',
      rng: repeatingRng(0.99),
    })).toEqual([7, 2]);
  });

  it('hard blocks an immediate human win', () => {
    const board = boardWithMoves(15, [
      [5, 4, 'X'],
      [5, 5, 'X'],
      [5, 6, 'X'],
      [5, 7, 'X'],
      [8, 8, 'O'],
    ]);

    expect(aiMove(board, {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'hard',
      rng: repeatingRng(0),
    })).toEqual([5, 3]);
  });

  it('medium and hard are deterministic when rng is injected', () => {
    const board = boardWithMoves(15, [
      [7, 7, 'X'],
      [7, 8, 'O'],
      [8, 7, 'X'],
      [8, 8, 'O'],
    ]);

    const mediumRngValues = Array(100).fill(0.42);
    const firstMediumMove = aiMove(board, {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'medium',
      rng: sequenceRng(mediumRngValues),
    });
    const secondMediumMove = aiMove(board, {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'medium',
      rng: sequenceRng(mediumRngValues),
    });

    expect(firstMediumMove).toEqual(secondMediumMove);
    expect(aiMove(board, {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'hard',
      rng: repeatingRng(0.42),
    })).toEqual(aiMove(board, {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'hard',
      rng: repeatingRng(0.42),
    }));
  });

  it('easy can choose a non-best move when its mistake path triggers', () => {
    const board = boardWithMoves(15, [
      [7, 7, 'O'],
      [7, 8, 'X'],
    ]);

    const hardBestMove = aiMove(board, {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'hard',
      rng: repeatingRng(0),
    });
    const easyMistakeMove = aiMove(board, {
      aiPlayer: 'O',
      humanPlayer: 'X',
      difficulty: 'easy',
      rng: repeatingRng(0),
    });

    expect(easyMistakeMove).not.toEqual(hardBestMove);
  });
});
