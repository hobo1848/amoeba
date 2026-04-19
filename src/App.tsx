import { useState, useEffect, useCallback } from 'react';
import { AESTHETICS, TIMINGS, type Difficulty, type GridSize } from './tokens';
import { useGame } from './game/useGame';
import { aiMove } from './game/aiMove';
import { Board } from './components/Board';
import { MarginNotes } from './components/MarginNotes';
import { Tweaks, type TweakState } from './components/Tweaks';
import { WinBanner } from './components/WinBanner';

const DEFAULT_TWEAKS: TweakState = {
  aesthetic: 'b',
  roughness: 15,
  gridSize: 15,
  paperTexture: true,
  showCoords: false,
};

export function App() {
  const [tweaks, setTweaks] = useState<TweakState>(DEFAULT_TWEAKS);
  const [tweakOpen, setTweakOpen] = useState(false);
  const theme = AESTHETICS[tweaks.aesthetic];
  const gridSize = tweaks.gridSize;
  const roughness01 = tweaks.roughness / 100;

  const { state, place, undo, reset } = useGame(gridSize);
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [xWins, setXWins] = useState(0);
  const [oWins, setOWins] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  useEffect(() => { reset(); setThinking(false); setHovered(null); }, [gridSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const newGame = useCallback(() => {
    reset();
    setThinking(false);
  }, [reset]);

  const onCellClick = (row: number, col: number) => {
    if (state.win || state.turn !== 'X' || state.board[row][col]) return;
    place(row, col, 'X');
  };

  useEffect(() => {
    if (state.win) {
      if (state.win.player === 'X') setXWins(v => v + 1);
      else setOWins(v => v + 1);
      return;
    }
    if (state.turn === 'O' && !thinking) {
      setThinking(true);
      const [lo, hi] = TIMINGS.aiDelayMs[difficulty];
      const delay = lo + Math.random() * (hi - lo);
      const t = setTimeout(() => {
        const [row, col] = aiMove(state.board, {
          aiPlayer: 'O',
          humanPlayer: 'X',
          difficulty,
        });
        place(row, col, 'O');
        setThinking(false);
      }, delay);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.turn, state.win, state.board, difficulty]);

  const updateTweak = (patch: Partial<TweakState>) => {
    setTweaks(prev => ({ ...prev, ...patch }));
  };

  return (
    <div className="app" style={{ color: theme.ui }}>
      <div
        className="page"
        style={{ background: theme.paper }}
      >
        <div className="page-inner">
          <div className="board-wrap">
            <WinBanner win={state.win} theme={theme} />
            <Board
              theme={theme}
              gridSize={gridSize as number}
              roughness01={roughness01}
              showTexture={tweaks.paperTexture}
              showCoords={tweaks.showCoords}
              state={state}
              hovered={hovered}
              onCellClick={onCellClick}
              onHover={setHovered}
            />
            <button className="board-new-game" onClick={newGame} style={{ color: theme.ui }}>new game</button>
          </div>

          <MarginNotes
            theme={theme}
            state={state}
            gridSize={gridSize as GridSize}
            xWins={xWins}
            oWins={oWins}
            thinking={thinking}
            difficulty={difficulty}
            onDifficulty={setDifficulty}
            onNewGame={newGame}
            onUndo={undo}
          />
        </div>
      </div>

      <Tweaks
        tweaks={tweaks}
        open={tweakOpen}
        onToggle={() => setTweakOpen(o => !o)}
        onChange={updateTweak}
        theme={theme}
      />
    </div>
  );
}
