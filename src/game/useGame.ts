import { useReducer } from 'react';
import { type Board, type Player, type WinResult, emptyBoard, checkWinAt } from './checkWin';

export interface Move {
  r: number;
  c: number;
  player: Player;
}

export interface GameState {
  board: Board;
  turn: Player;
  moves: number;
  lastMove: Move | null;
  win: WinResult | null;
  history: Move[];
}

type Action =
  | { type: 'PLACE'; r: number; c: number; player: Player }
  | { type: 'UNDO'; gridSize: number }
  | { type: 'RESET'; gridSize: number };

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'PLACE': {
      const { r, c, player } = action;
      if (state.win || state.board[r][c]) return state;
      const board = state.board.map(row => row.slice());
      board[r][c] = player;
      const win = checkWinAt(board, r, c);
      return {
        board,
        turn: player === 'X' ? 'O' : 'X',
        moves: state.moves + 1,
        lastMove: { r, c, player },
        win,
        history: [...state.history, { r, c, player }],
      };
    }
    case 'UNDO': {
      if (!state.history.length) return state;
      const steps = state.history.length >= 2 && !state.win ? 2 : 1;
      const hist = state.history.slice(0, -steps);
      const board = emptyBoard(action.gridSize);
      hist.forEach(m => { board[m.r][m.c] = m.player; });
      return {
        board,
        turn: 'X',
        moves: hist.length,
        lastMove: hist[hist.length - 1] ?? null,
        win: null,
        history: hist,
      };
    }
    case 'RESET':
      return {
        board: emptyBoard(action.gridSize),
        turn: 'X',
        moves: 0,
        lastMove: null,
        win: null,
        history: [],
      };
  }
}

export function useGame(gridSize: number) {
  const [state, dispatch] = useReducer(
    gameReducer,
    gridSize,
    (n): GameState => ({
      board: emptyBoard(n),
      turn: 'X',
      moves: 0,
      lastMove: null,
      win: null,
      history: [],
    }),
  );

  const place = (r: number, c: number, player: Player) =>
    dispatch({ type: 'PLACE', r, c, player });

  const undo = () => dispatch({ type: 'UNDO', gridSize });
  const reset = () => dispatch({ type: 'RESET', gridSize });

  return { state, place, undo, reset };
}
