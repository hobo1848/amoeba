import { useReducer } from 'react';
import { type Board, type Player, emptyBoard } from './checkWin';
import { calculateTerritory, type TerritoryResult, MOYO_MOVES_PER_SIDE } from './moyoLogic';

export interface MoyoMove {
  row: number;
  col: number;
  player: Player;
}

export interface MoyoState {
  board: Board;
  turn: Player;
  movesX: number;
  movesO: number;
  gameOver: boolean;
  lastMove: MoyoMove | null;
  history: MoyoMove[];
  territory: TerritoryResult;
}

type Action =
  | { type: 'PLACE'; row: number; col: number; player: Player }
  | { type: 'UNDO' }
  | { type: 'RESET'; boardSize: number };

function initState(boardSize: number): MoyoState {
  const board = emptyBoard(boardSize);
  return {
    board,
    turn: 'X',
    movesX: 0,
    movesO: 0,
    gameOver: false,
    lastMove: null,
    history: [],
    territory: calculateTerritory(board),
  };
}

function reducer(state: MoyoState, action: Action): MoyoState {
  switch (action.type) {
    case 'PLACE': {
      const { row, col, player } = action;
      if (state.gameOver || state.board[row][col]) return state;
      if (player === 'X' && state.movesX >= MOYO_MOVES_PER_SIDE) return state;
      if (player === 'O' && state.movesO >= MOYO_MOVES_PER_SIDE) return state;

      const board = state.board.map(r => r.slice());
      board[row][col] = player;

      const newMovesX = player === 'X' ? state.movesX + 1 : state.movesX;
      const newMovesO = player === 'O' ? state.movesO + 1 : state.movesO;
      const gameOver = newMovesX >= MOYO_MOVES_PER_SIDE && newMovesO >= MOYO_MOVES_PER_SIDE;
      const territory = calculateTerritory(board);

      return {
        board,
        turn: player === 'X' ? 'O' : 'X',
        movesX: newMovesX,
        movesO: newMovesO,
        gameOver,
        lastMove: { row, col, player },
        history: [...state.history, { row, col, player }],
        territory,
      };
    }
    case 'UNDO': {
      if (!state.history.length || state.gameOver) return state;
      const steps = state.history.length >= 2 ? 2 : 1;
      const history = state.history.slice(0, -steps);
      const boardSize = state.board.length;
      const board = emptyBoard(boardSize);
      history.forEach(m => { board[m.row][m.col] = m.player; });
      const movesX = history.filter(m => m.player === 'X').length;
      const movesO = history.filter(m => m.player === 'O').length;
      return {
        board,
        turn: 'X',
        movesX,
        movesO,
        gameOver: false,
        lastMove: history[history.length - 1] ?? null,
        history,
        territory: calculateTerritory(board),
      };
    }
    case 'RESET':
      return initState(action.boardSize);
  }
}

export function useMoyo(boardSize: number) {
  const [state, dispatch] = useReducer(reducer, boardSize, initState);

  const place = (row: number, col: number, player: Player) =>
    dispatch({ type: 'PLACE', row, col, player });
  const undo = () => dispatch({ type: 'UNDO' });
  const reset = (size?: number) =>
    dispatch({ type: 'RESET', boardSize: size ?? state.board.length });

  return { state, place, undo, reset };
}
