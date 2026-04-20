import { useReducer } from 'react';
import { type Board, type Player, emptyBoard } from './checkWin';
import { findCaptures, checkPenteWin, type PenteWin } from './pente';

export interface PenteMove {
  row: number;
  col: number;
  player: Player;
  capturedCells: [number, number][];
}

export interface PenteState {
  board: Board;
  turn: Player;
  pairsX: number;
  pairsO: number;
  win: PenteWin | null;
  lastMove: PenteMove | null;
  history: PenteMove[];
}

const BOARD_SIZE = 15;

type Action =
  | { type: 'PLACE'; row: number; col: number; player: Player }
  | { type: 'UNDO' }
  | { type: 'RESET' };

function initState(): PenteState {
  return {
    board: emptyBoard(BOARD_SIZE),
    turn: 'X',
    pairsX: 0,
    pairsO: 0,
    win: null,
    lastMove: null,
    history: [],
  };
}

function replayHistory(moves: PenteMove[]): Pick<PenteState, 'board' | 'pairsX' | 'pairsO'> {
  const board = emptyBoard(BOARD_SIZE);
  let pairsX = 0, pairsO = 0;
  for (const m of moves) {
    board[m.row][m.col] = m.player;
    for (const [cr, cc] of m.capturedCells) board[cr][cc] = null;
    const pairs = m.capturedCells.length / 2;
    if (m.player === 'X') pairsX += pairs;
    else pairsO += pairs;
  }
  return { board, pairsX, pairsO };
}

function reducer(state: PenteState, action: Action): PenteState {
  switch (action.type) {
    case 'PLACE': {
      const { row, col, player } = action;
      if (state.win || state.board[row][col]) return state;

      const capturedCells = findCaptures(state.board, row, col, player);

      const board = state.board.map(r => r.slice());
      board[row][col] = player;
      for (const [cr, cc] of capturedCells) board[cr][cc] = null;

      const newPairsX = state.pairsX + (player === 'X' ? capturedCells.length / 2 : 0);
      const newPairsO = state.pairsO + (player === 'O' ? capturedCells.length / 2 : 0);
      const win = checkPenteWin(board, row, col, newPairsX, newPairsO);
      const move: PenteMove = { row, col, player, capturedCells };

      return {
        board,
        turn: player === 'X' ? 'O' : 'X',
        pairsX: newPairsX,
        pairsO: newPairsO,
        win,
        lastMove: move,
        history: [...state.history, move],
      };
    }
    case 'UNDO': {
      if (!state.history.length) return state;
      // After a win undo 1 move; during play undo human + AI reply
      const steps = state.history.length >= 2 && !state.win ? 2 : 1;
      const history = state.history.slice(0, -steps);
      const { board, pairsX, pairsO } = replayHistory(history);
      return {
        board,
        turn: 'X',
        pairsX,
        pairsO,
        win: null,
        lastMove: history[history.length - 1] ?? null,
        history,
      };
    }
    case 'RESET':
      return initState();
  }
}

export function usePente() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const place = (row: number, col: number, player: Player) =>
    dispatch({ type: 'PLACE', row, col, player });
  const undo = () => dispatch({ type: 'UNDO' });
  const reset = () => dispatch({ type: 'RESET' });
  return { state, place, undo, reset };
}
