import { useState, useEffect, useCallback, useMemo } from 'react';
import { AESTHETICS, TIMINGS, type Difficulty, type GridSize } from './tokens';
import { useGame } from './game/useGame';
import { usePatternStats } from './game/usePatternStats';
import { aiMove } from './game/aiMove';
import { useMoyo } from './game/useMoyo';
import { moyoAiMove } from './game/moyoAI';
import { moyoBoardSize, MOYO_MOVES_PER_SIDE } from './game/moyoLogic';
import { detectMoyoPatterns } from './game/moyoPatterns';
import { Board } from './components/Board';
import { MarginNotes } from './components/MarginNotes';
import { MoyoMarginNotes } from './components/MoyoMarginNotes';
import { Tweaks, type TweakState } from './components/Tweaks';
import { WinBanner } from './components/WinBanner';
import { MoyoWinBanner } from './components/MoyoWinBanner';
import { TerritoryOverlay } from './components/TerritoryOverlay';
import { BOARD } from './tokens';
import type { GameState } from './game/useGame';

type AppMode = 'gomoku' | 'moyo';

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
  const [mode, setMode] = useState<AppMode>('gomoku');
  const theme = AESTHETICS[tweaks.aesthetic];
  const gridSize = tweaks.gridSize;
  const roughness01 = tweaks.roughness / 100;

  // ── Gomoku ────────────────────────────────────────────────────────────────
  const { state, place, undo, reset } = useGame(gridSize);
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [winRecorded, setWinRecorded] = useState(false);

  const {
    sessionStats, settings, activeShapes, forkShapeKeys, blockedAnim,
    outlineVariant, gameOpenThreesX,
    onWin, onNewGame: notifyNewGame, toggleShowPatterns, toggleReference, resetStats,
  } = usePatternStats({ history: state.history, board: state.board, gridSize, winPlayer: state.win?.player ?? null });

  useEffect(() => { reset(); setThinking(false); setHovered(null); }, [gridSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const newGame = useCallback(() => {
    reset();
    notifyNewGame();
    setThinking(false);
    setWinRecorded(false);
  }, [reset, notifyNewGame]);

  const onCellClick = (row: number, col: number) => {
    if (mode !== 'gomoku') return;
    if (state.win || state.turn !== 'X' || state.board[row][col]) return;
    place(row, col, 'X');
  };

  useEffect(() => {
    if (mode !== 'gomoku') return;
    if (state.win) {
      if (!winRecorded) { onWin(state.win.player); setWinRecorded(true); }
      return;
    }
    setWinRecorded(false);
    if (state.turn === 'O' && !thinking) {
      setThinking(true);
      const [lo, hi] = TIMINGS.aiDelayMs[difficulty];
      const delay = lo + Math.random() * (hi - lo);
      const t = setTimeout(() => {
        const [row, col] = aiMove(state.board, { aiPlayer: 'O', humanPlayer: 'X', difficulty });
        place(row, col, 'O');
        setThinking(false);
      }, delay);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state.turn, state.win, state.board, difficulty]);

  // ── Moyo ──────────────────────────────────────────────────────────────────
  const moyoBoardSz = moyoBoardSize(difficulty);
  const { state: moyoState, place: moyoPlace, undo: moyoUndo, reset: moyoReset } = useMoyo(moyoBoardSz);
  const [moyoHovered, setMoyoHovered] = useState<{ row: number; col: number } | null>(null);
  const [moyoThinking, setMoyoThinking] = useState(false);
  const [moyoShowPatterns, setMoyoShowPatterns] = useState(true);
  const [moyoReferenceOpen, setMoyoReferenceOpen] = useState(false);

  const moyoPatterns = useMemo(
    () => detectMoyoPatterns(moyoState.board, moyoState.territory),
    [moyoState.board, moyoState.territory],
  );

  const moyoNewGame = useCallback(() => {
    moyoReset(moyoBoardSize(difficulty));
    setMoyoThinking(false);
    setMoyoHovered(null);
  }, [moyoReset, difficulty]);

  // Reset Moyo board when difficulty changes (board size changes)
  useEffect(() => {
    if (mode === 'moyo') moyoReset(moyoBoardSize(difficulty));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const onMoyoCellClick = (row: number, col: number) => {
    if (mode !== 'moyo') return;
    if (moyoState.gameOver || moyoState.turn !== 'X' || moyoState.board[row][col]) return;
    if (moyoState.movesX >= MOYO_MOVES_PER_SIDE) return;
    moyoPlace(row, col, 'X');
  };

  useEffect(() => {
    if (mode !== 'moyo') return;
    if (moyoState.gameOver) return;
    if (moyoState.turn === 'O' && !moyoThinking && moyoState.movesO < MOYO_MOVES_PER_SIDE) {
      setMoyoThinking(true);
      const [lo, hi] = TIMINGS.aiDelayMs[difficulty];
      const delay = lo + Math.random() * (hi - lo);
      const t = setTimeout(() => {
        const [row, col] = moyoAiMove(moyoState.board, difficulty, 'O');
        moyoPlace(row, col, 'O');
        setMoyoThinking(false);
      }, delay);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, moyoState.turn, moyoState.gameOver, moyoState.board, difficulty]);

  // ── Mode switching ────────────────────────────────────────────────────────
  const switchMode = (next: AppMode) => {
    setMode(next);
    setThinking(false);
    setMoyoThinking(false);
    setHovered(null);
    setMoyoHovered(null);
    if (next === 'moyo') moyoReset(moyoBoardSize(difficulty));
  };

  // ── Shared ────────────────────────────────────────────────────────────────
  const updateTweak = (patch: Partial<TweakState>) => setTweaks(prev => ({ ...prev, ...patch }));

  // Board adapter for Moyo: maps MoyoState into the GameState shape Board expects
  const moyoBoardState = useMemo((): GameState => ({
    board: moyoState.board,
    turn: moyoState.turn,
    moves: moyoState.movesX + moyoState.movesO,
    lastMove: moyoState.lastMove,
    win: null,
    history: moyoState.history,
  }), [moyoState]);

  // For Moyo, use fixed cellPx = floor(600/15) so the smaller board is centered
  const FRAME_GRID_SIZE = 15;
  const moyoCellPx = BOARD.cellPx(FRAME_GRID_SIZE);
  const moyoBoardPx = moyoCellPx * moyoBoardSz;
  const moyoFramePx = moyoCellPx * FRAME_GRID_SIZE;
  const moyoBoardOffsetX = Math.floor((moyoFramePx - moyoBoardPx) / 2);
  const moyoBoardOffsetY = Math.floor((moyoFramePx - moyoBoardPx) / 2);

  return (
    <div className="app" style={{ color: theme.ui }}>
      <div className="page" style={{ background: theme.paper }}>

        {/* ── Mode toggle ─────────────────────────────────────────── */}
        <div className="mode-toggle-bar" style={{ color: theme.ui }}>
          <button
            className={`mode-btn${mode === 'gomoku' ? ' mode-btn--active' : ''}`}
            onClick={() => switchMode('gomoku')}
            style={{ color: theme.ui }}
          >
            5-in-a-row
          </button>
          <span className="mode-sep" style={{ opacity: 0.35 }}>|</span>
          <button
            className={`mode-btn${mode === 'moyo' ? ' mode-btn--active' : ''}`}
            onClick={() => switchMode('moyo')}
            style={{ color: theme.ui }}
          >
            Moyo
          </button>
        </div>

        <div className="page-inner">
          {/* ── Gomoku ────────────────────────────────────────────── */}
          {mode === 'gomoku' && (
            <>
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
                  activeShapes={activeShapes}
                  forkShapeKeys={forkShapeKeys}
                  blockedAnim={blockedAnim}
                  showPatterns={settings.showPatterns}
                  outlineVariant={outlineVariant}
                />
                <button className="board-new-game" onClick={newGame} style={{ color: theme.ui }}>new game</button>
              </div>

              <MarginNotes
                theme={theme}
                state={state}
                gridSize={gridSize as GridSize}
                sessionStats={sessionStats}
                settings={settings}
                thinking={thinking}
                difficulty={difficulty}
                onDifficulty={setDifficulty}
                onNewGame={newGame}
                onUndo={undo}
                onTogglePatterns={toggleShowPatterns}
                onToggleReference={toggleReference}
                onResetStats={resetStats}
                gameOpenThreesX={gameOpenThreesX}
              />
            </>
          )}

          {/* ── Moyo ──────────────────────────────────────────────── */}
          {mode === 'moyo' && (
            <>
              <div className="board-wrap">
                <MoyoWinBanner gameOver={moyoState.gameOver} territory={moyoState.territory} theme={theme} />
                <Board
                  theme={theme}
                  gridSize={moyoBoardSz}
                  frameGridSize={FRAME_GRID_SIZE}
                  roughness01={roughness01}
                  showTexture={tweaks.paperTexture}
                  showCoords={tweaks.showCoords}
                  state={moyoBoardState}
                  hovered={moyoHovered}
                  onCellClick={onMoyoCellClick}
                  onHover={setMoyoHovered}
                  showPatterns={false}
                  overlayContent={
                    <TerritoryOverlay
                      territory={moyoState.territory}
                      boardSize={moyoBoardSz}
                      cellPx={moyoCellPx}
                      pad={28}
                      boardOffsetX={moyoBoardOffsetX}
                      boardOffsetY={moyoBoardOffsetY}
                      theme={theme}
                      show={moyoShowPatterns}
                    />
                  }
                />
                <button className="board-new-game" onClick={moyoNewGame} style={{ color: theme.ui }}>new game</button>
              </div>

              <MoyoMarginNotes
                theme={theme}
                state={moyoState}
                boardSize={moyoBoardSz}
                thinking={moyoThinking}
                difficulty={difficulty}
                patterns={moyoPatterns}
                showPatterns={moyoShowPatterns}
                referenceOpen={moyoReferenceOpen}
                onDifficulty={setDifficulty}
                onNewGame={moyoNewGame}
                onUndo={moyoUndo}
                onTogglePatterns={() => setMoyoShowPatterns(v => !v)}
                onToggleReference={() => setMoyoReferenceOpen(v => !v)}
              />
            </>
          )}
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
