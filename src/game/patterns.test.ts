import { describe, it, expect } from 'vitest';
import { detectActiveShapes, analyseMove, getForkShapes } from './patterns';
import { emptyBoard } from './checkWin';
import type { Board } from './checkWin';

function place(board: Board, marks: [number, number, 'X' | 'O'][]): Board {
  const b = board.map(r => r.slice());
  for (const [row, col, p] of marks) b[row][col] = p;
  return b;
}

// ── Open Three ───────────────────────────────────────────────────────────────

describe('detectActiveShapes — open-three', () => {
  it('detects horizontal open-three', () => {
    const board = place(emptyBoard(15), [[7, 5, 'X'], [7, 6, 'X'], [7, 7, 'X']]);
    const shapes = detectActiveShapes(board);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].kind).toBe('open-three');
    expect(shapes[0].player).toBe('X');
  });

  it('detects vertical open-three', () => {
    const board = place(emptyBoard(15), [[4, 7, 'O'], [5, 7, 'O'], [6, 7, 'O']]);
    const shapes = detectActiveShapes(board);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].kind).toBe('open-three');
    expect(shapes[0].dir).toEqual([1, 0]);
  });

  it('detects diagonal open-three (↘)', () => {
    const board = place(emptyBoard(15), [[3, 3, 'X'], [4, 4, 'X'], [5, 5, 'X']]);
    const shapes = detectActiveShapes(board);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].dir).toEqual([1, 1]);
  });

  it('detects diagonal open-three (↙)', () => {
    const board = place(emptyBoard(15), [[3, 9, 'X'], [4, 8, 'X'], [5, 7, 'X']]);
    const shapes = detectActiveShapes(board);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].dir).toEqual([1, -1]);
  });

  it('does NOT report when both ends are blocked by opponent', () => {
    // _OXXX O_  → closed on both sides by O
    const board = place(emptyBoard(15), [
      [7, 3, 'O'], [7, 4, 'X'], [7, 5, 'X'], [7, 6, 'X'], [7, 7, 'O'],
    ]);
    const shapes = detectActiveShapes(board).filter(s => s.player === 'X');
    expect(shapes).toHaveLength(0);
  });

  it('does NOT report when one end is at the board edge', () => {
    // Edge: row 7, cols 0,1,2 — before-cell is out of bounds (closed)
    const board = place(emptyBoard(15), [[7, 0, 'X'], [7, 1, 'X'], [7, 2, 'X']]);
    const shapes = detectActiveShapes(board).filter(s => s.player === 'X');
    expect(shapes).toHaveLength(0);
  });

  it('ignores runs of 2', () => {
    const board = place(emptyBoard(15), [[7, 5, 'X'], [7, 6, 'X']]);
    expect(detectActiveShapes(board)).toHaveLength(0);
  });

  it('ignores a run of 5 (win, not a shape)', () => {
    const board = place(emptyBoard(15), [
      [7, 3, 'X'], [7, 4, 'X'], [7, 5, 'X'], [7, 6, 'X'], [7, 7, 'X'],
    ]);
    expect(detectActiveShapes(board).filter(s => s.player === 'X')).toHaveLength(0);
  });
});

// ── Four ─────────────────────────────────────────────────────────────────────

describe('detectActiveShapes — four', () => {
  it('detects four with one open end', () => {
    // _XXXX O — open before, closed after
    const board = place(emptyBoard(15), [
      [7, 3, 'X'], [7, 4, 'X'], [7, 5, 'X'], [7, 6, 'X'], [7, 7, 'O'],
    ]);
    const shapes = detectActiveShapes(board).filter(s => s.player === 'X');
    expect(shapes).toHaveLength(1);
    expect(shapes[0].kind).toBe('four');
  });

  it('detects four with both ends open', () => {
    const board = place(emptyBoard(15), [
      [7, 4, 'X'], [7, 5, 'X'], [7, 6, 'X'], [7, 7, 'X'],
    ]);
    const shapes = detectActiveShapes(board).filter(s => s.player === 'X');
    expect(shapes).toHaveLength(1);
    expect(shapes[0].kind).toBe('four');
  });

  it('does NOT report four when both ends closed', () => {
    const board = place(emptyBoard(15), [
      [7, 2, 'O'], [7, 3, 'X'], [7, 4, 'X'], [7, 5, 'X'], [7, 6, 'X'], [7, 7, 'O'],
    ]);
    const shapes = detectActiveShapes(board).filter(s => s.player === 'X');
    expect(shapes).toHaveLength(0);
  });
});

// ── Multiple shapes ───────────────────────────────────────────────────────────

describe('detectActiveShapes — multiple shapes', () => {
  it('detects both player shapes independently', () => {
    const board = place(emptyBoard(15), [
      [3, 3, 'X'], [3, 4, 'X'], [3, 5, 'X'],
      [8, 8, 'O'], [8, 9, 'O'], [8, 10, 'O'],
    ]);
    const shapes = detectActiveShapes(board);
    expect(shapes).toHaveLength(2);
    expect(shapes.map(s => s.player).sort()).toEqual(['O', 'X']);
  });

  it('a cell in two shapes reports both', () => {
    // Horizontal AND vertical open-three sharing one cell
    const board = place(emptyBoard(15), [
      [5, 5, 'X'], [5, 6, 'X'], [5, 7, 'X'], // horizontal
      [4, 5, 'X'], [6, 5, 'X'],               // extend vertical through (5,5)
    ]);
    const shapes = detectActiveShapes(board).filter(s => s.player === 'X');
    // horizontal open-three + vertical open-three (3 cells each: [4,5],[5,5],[6,5])
    expect(shapes.length).toBeGreaterThanOrEqual(2);
  });
});

// ── analyseMove ───────────────────────────────────────────────────────────────

describe('analyseMove', () => {
  it('counts open-three created', () => {
    const before = place(emptyBoard(15), [[7, 5, 'X'], [7, 6, 'X']]);
    const after  = place(before, [[7, 7, 'X']]);
    const ev = analyseMove(before, after, 7, 7, 'X');
    expect(ev.openThreesCreated).toBe(1);
    expect(ev.foursCreated).toBe(0);
    expect(ev.isFork).toBe(false);
    expect(ev.blocked).toBe(false);
  });

  it('counts four created', () => {
    const before = place(emptyBoard(15), [[7, 5, 'X'], [7, 6, 'X'], [7, 7, 'X']]);
    // Close one end so it's an open-three first, then extend
    const after  = place(before, [[7, 8, 'X']]);
    const ev = analyseMove(before, after, 7, 8, 'X');
    expect(ev.foursCreated).toBe(1);
  });

  it('detects fork (two new shapes from one move)', () => {
    // Set up so placing at (5,5) creates both a horizontal and vertical open-three.
    const before = place(emptyBoard(15), [
      [5, 3, 'X'], [5, 4, 'X'],   // horizontal pair needs (5,5) to become open-three
      [3, 5, 'X'], [4, 5, 'X'],   // vertical pair needs (5,5)
    ]);
    const after = place(before, [[5, 5, 'X']]);
    const ev = analyseMove(before, after, 5, 5, 'X');
    expect(ev.isFork).toBe(true);
  });

  it('detects blocked threat (landing on open end of opponent shape)', () => {
    // O has open-three at row 7, cols 5-7; open ends are col 4 and col 8.
    const before = place(emptyBoard(15), [
      [7, 5, 'O'], [7, 6, 'O'], [7, 7, 'O'],
    ]);
    const after = place(before, [[7, 8, 'X']]);
    const ev = analyseMove(before, after, 7, 8, 'X');
    expect(ev.blocked).toBe(true);
  });

  it('blocked is false when move does NOT land on open end', () => {
    const before = place(emptyBoard(15), [
      [7, 5, 'O'], [7, 6, 'O'], [7, 7, 'O'],
    ]);
    const after = place(before, [[3, 3, 'X']]);
    const ev = analyseMove(before, after, 3, 3, 'X');
    expect(ev.blocked).toBe(false);
  });
});

// ── getForkShapes ─────────────────────────────────────────────────────────────

describe('getForkShapes', () => {
  it('returns empty array when not a fork', () => {
    const before = place(emptyBoard(15), [[7, 5, 'X'], [7, 6, 'X']]);
    const after  = place(before, [[7, 7, 'X']]);
    expect(getForkShapes(before, after, 7, 7, 'X')).toHaveLength(0);
  });

  it('returns the constituent shapes of a fork', () => {
    const before = place(emptyBoard(15), [
      [5, 3, 'X'], [5, 4, 'X'],
      [3, 5, 'X'], [4, 5, 'X'],
    ]);
    const after = place(before, [[5, 5, 'X']]);
    const forkShapes = getForkShapes(before, after, 5, 5, 'X');
    expect(forkShapes.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Undo re-detection correctness ─────────────────────────────────────────────

describe('undo re-detection', () => {
  it('shape disappears after undo removes its cells', () => {
    // After X plays at (7,7), there's an open-three 5-6-7.
    const boardWith = place(emptyBoard(15), [[7, 5, 'X'], [7, 6, 'X'], [7, 7, 'X']]);
    expect(detectActiveShapes(boardWith).filter(s => s.player === 'X')).toHaveLength(1);

    // After undo (remove (7,7)), it's just a pair — no shapes.
    const boardAfterUndo = place(emptyBoard(15), [[7, 5, 'X'], [7, 6, 'X']]);
    expect(detectActiveShapes(boardAfterUndo).filter(s => s.player === 'X')).toHaveLength(0);
  });

  it('shape is restored correctly when undo reverts back to open-three', () => {
    // Three → four → undo → three
    const three = place(emptyBoard(15), [[7, 5, 'X'], [7, 6, 'X'], [7, 7, 'X']]);
    const four  = place(three, [[7, 8, 'X']]);
    expect(detectActiveShapes(four).filter(s => s.kind === 'four')).toHaveLength(1);
    expect(detectActiveShapes(three).filter(s => s.kind === 'open-three')).toHaveLength(1);
  });
});
