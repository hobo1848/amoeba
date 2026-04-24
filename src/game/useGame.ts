import { useReducer } from 'react';
import { type Board, type Player, type WinResult, emptyBoard, checkWinAt } from './checkWin';

export interface Move {
  row: number;
  col: number;
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
  | { type: 'PLACE'; row: number; col: number; player: Player }
  | { type: 'UNDO'; gridSize: number }
  | { type: 'RESET'; gridSize: number };

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'PLACE': {
      const { row, col, player } = action;
      if (state.win || state.board[row][col]) return state;

      // Copy each row before editing so React receives a fresh board object.
      const board = state.board.map(r => r.slice());
      board[row][col] = player;
      const win = checkWinAt(board, row, col);
      return {
        board,
        turn: player === 'X' ? 'O' : 'X',
        moves: state.moves + 1,
        lastMove: { row, col, player },
        win,
        history: [...state.history, { row, col, player }],
      };
    }
    case 'UNDO': {
      if (!state.history.length) return state;

      // During an active game, undo removes the human move and the AI reply.
      // After a win, only the winning move is removed so the board returns to
      // the position immediately before the result.
      const steps = state.history.length >= 2 && !state.win ? 2 : 1;
      const history = state.history.slice(0, -steps);
      const board = emptyBoard(action.gridSize);
      history.forEach(move => { board[move.row][move.col] = move.player; });
      return {
        board,
        turn: 'X',
        moves: history.length,
        lastMove: history[history.length - 1] ?? null,
        win: null,
        history,
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
    (boardSize): GameState => ({
      board: emptyBoard(boardSize),
      turn: 'X',
      moves: 0,
      lastMove: null,
      win: null,
      history: [],
    }),
  );

  const place = (row: number, col: number, player: Player) =>
    dispatch({ type: 'PLACE', row, col, player });

  const undo = () => dispatch({ type: 'UNDO', gridSize });
  const reset = () => dispatch({ type: 'RESET', gridSize });

  return { state, place, undo, reset };
}
