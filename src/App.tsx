import { useState, useEffect, useCallback, useMemo } from 'react';
import { AESTHETICS, TIMINGS, type Difficulty } from './tokens';
import { useGame } from './game/useGame';
import { usePatternStats } from './game/usePatternStats';
import { aiMove } from './game/aiMove';
import { usePente } from './game/usePente';
import { penteAiMove } from './game/penteAI';
import { countThreats, findVulnerablePairs } from './game/pente';
import { Board } from './components/Board';
import { MarginNotes } from './components/MarginNotes';
import { PenteMarginNotes } from './components/PenteMarginNotes';
import { Tweaks, type TweakState } from './components/Tweaks';
import { WinBanner } from './components/WinBanner';
import { PenteWinBanner } from './components/PenteWinBanner';
import { CaptureOverlay } from './components/CaptureOverlay';
import { TurnIndicator } from './components/TurnIndicator';
import { BOARD } from './tokens';
import type { GameState } from './game/useGame';

type AppMode = 'gomoku' | 'pente';

const DEFAULT_TWEAKS: TweakState = {
  aesthetic: 'b',
  roughness: 15,
  gridSize: 15,
  paperTexture: true,
  showCoords: false,
};

const DIFFICULTY_LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];

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

  // ── Pente ─────────────────────────────────────────────────────────────────
  const { state: penteState, place: pentePlace, undo: penteUndo, reset: penteReset } = usePente();
  const [penteHovered, setPenteHovered] = useState<{ row: number; col: number } | null>(null);
  const [penteThinking, setPenteThinking] = useState(false);
  const [penteWinRecorded, setPenteWinRecorded] = useState(false);

  const {
    sessionStats: penteSessionStats,
    settings: penteSettings,
    activeShapes: penteActiveShapes,
    forkShapeKeys: penteForkShapeKeys,
    blockedAnim: penteBlockedAnim,
    outlineVariant: penteOutlineVariant,
    gameOpenThreesX: penteGameOpenThreesX,
    onWin: penteOnWin,
    onNewGame: penteNotifyNewGame,
    toggleShowPatterns: penteToggleShowPatterns,
    toggleReference: penteToggleReference,
    resetStats: penteResetStats,
  } = usePatternStats({
    history: penteState.history,
    board: penteState.board,
    gridSize: 15,
    winPlayer: penteState.win?.player ?? null,
  });

  const penteNewGame = useCallback(() => {
    penteReset();
    penteNotifyNewGame();
    setPenteThinking(false);
    setPenteWinRecorded(false);
    setPenteHovered(null);
  }, [penteReset, penteNotifyNewGame]);

  const onPenteCellClick = (row: number, col: number) => {
    if (mode !== 'pente') return;
    if (penteState.win || penteState.turn !== 'X' || penteState.board[row][col]) return;
    pentePlace(row, col, 'X');
  };

  useEffect(() => {
    if (mode !== 'pente') return;
    if (penteState.win) {
      if (!penteWinRecorded) {
        penteOnWin(penteState.win.player);
        setPenteWinRecorded(true);
      }
      return;
    }
    setPenteWinRecorded(false);
    if (penteState.turn === 'O' && !penteThinking) {
      setPenteThinking(true);
      const [lo, hi] = TIMINGS.aiDelayMs[difficulty];
      const delay = lo + Math.random() * (hi - lo);
      const t = setTimeout(() => {
        const [row, col] = penteAiMove(penteState.board, {
          aiPlayer: 'O',
          humanPlayer: 'X',
          difficulty,
          pairsAI: penteState.pairsO,
          pairsHuman: penteState.pairsX,
        });
        pentePlace(row, col, 'O');
        setPenteThinking(false);
      }, delay);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, penteState.turn, penteState.win, penteState.board, difficulty]);

  const penteThreats = useMemo(() => ({
    X: countThreats(penteState.board, 'X').count,
    O: countThreats(penteState.board, 'O').count,
  }), [penteState.board]);

  const penteVuln = useMemo(() => ({
    pairsX: findVulnerablePairs(penteState.board, 'X'),
    pairsO: findVulnerablePairs(penteState.board, 'O'),
  }), [penteState.board]);

  const penteThreatsX = useMemo(() => countThreats(penteState.board, 'X').cells, [penteState.board]);
  const penteThreatsO = useMemo(() => countThreats(penteState.board, 'O').cells, [penteState.board]);

  const penteBoardState = useMemo((): GameState => ({
    board: penteState.board,
    turn: penteState.turn,
    moves: penteState.history.length,
    lastMove: penteState.lastMove,
    win: penteState.win?.type === 'line'
      ? { player: penteState.win.player, line: penteState.win.line! }
      : null,
    history: penteState.history,
  }), [penteState]);

  // ── Mode switching ────────────────────────────────────────────────────────
  const switchMode = (next: AppMode) => {
    setMode(next);
    setThinking(false);
    setPenteThinking(false);
    setHovered(null);
    setPenteHovered(null);
  };

  // ── Shared ────────────────────────────────────────────────────────────────
  const updateTweak = (patch: Partial<TweakState>) => setTweaks(prev => ({ ...prev, ...patch }));

  const penteCellPx = BOARD.cellPx(15);

  return (
    <div className="app" style={{ color: theme.ui }}>
      <div className="page" style={{ background: theme.paper }}>
        <div className="page-inner">

          {/* ── Board column ──────────────────────────────────────────── */}
          <div className="board-col">

            {/* ── Above-board header ── */}
            <div className="board-header" style={{ color: theme.ui }}>
              <div className="board-header-left">
                <h1 className="board-title">Amőba</h1>
                <div className="board-mode-selector">
                  <button
                    className={`mode-btn${mode === 'gomoku' ? ' mode-btn--active' : ''}`}
                    onClick={() => switchMode('gomoku')}
                    style={{ color: theme.ui }}
                  >
                    5-in-a-row
                  </button>
                  <span className="mode-sep" style={{ opacity: 0.35 }}>|</span>
                  <button
                    className={`mode-btn${mode === 'pente' ? ' mode-btn--active' : ''}`}
                    onClick={() => switchMode('pente')}
                    style={{ color: theme.ui }}
                  >
                    Pente
                  </button>
                </div>
              </div>
              <div className="board-header-right">
                {mode === 'gomoku' && (
                  <>
                    <TurnIndicator turn={state.turn} thinking={thinking} theme={theme} compact />
                    <div className="score-compact">
                      <div className="score-compact-item">
                        <div className="sc-n">{sessionStats.sessionWins.X}</div>
                        <div className="sc-l">X (you)</div>
                      </div>
                      <div className="score-compact-item">
                        <div className="sc-n">{sessionStats.sessionWins.O}</div>
                        <div className="sc-l">O (cpu)</div>
                      </div>
                    </div>
                  </>
                )}
                {mode === 'pente' && (
                  <>
                    <TurnIndicator turn={penteState.turn} thinking={penteThinking} theme={theme} compact />
                    <div className="score-compact">
                      <div className="score-compact-item">
                        <div className="sc-n">{penteSessionStats.sessionWins.X}</div>
                        <div className="sc-l">X (you)</div>
                      </div>
                      <div className="score-compact-item">
                        <div className="sc-n">{penteSessionStats.sessionWins.O}</div>
                        <div className="sc-l">O (cpu)</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Board ── */}
            {mode === 'gomoku' && (
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
              </div>
            )}
            {mode === 'pente' && (
              <div className="board-wrap">
                <PenteWinBanner win={penteState.win} theme={theme} />
                <Board
                  theme={theme}
                  gridSize={15}
                  roughness01={roughness01}
                  showTexture={tweaks.paperTexture}
                  showCoords={tweaks.showCoords}
                  state={penteBoardState}
                  hovered={penteHovered}
                  onCellClick={onPenteCellClick}
                  onHover={setPenteHovered}
                  activeShapes={penteActiveShapes}
                  forkShapeKeys={penteForkShapeKeys}
                  blockedAnim={penteBlockedAnim}
                  showPatterns={penteSettings.showPatterns}
                  outlineVariant={penteOutlineVariant}
                  overlayContent={
                    <CaptureOverlay
                      vulnPairs={[...penteVuln.pairsX, ...penteVuln.pairsO]}
                      threatCellsX={penteThreatsX}
                      threatCellsO={penteThreatsO}
                      cellPx={penteCellPx}
                      pad={BOARD.pad}
                      theme={theme}
                      show={penteSettings.showPatterns}
                    />
                  }
                />
              </div>
            )}

            {/* ── Below-board footer ── */}
            <div className="board-footer" style={{ color: theme.ui }}>
              <div className="board-footer-row">
                <div className="footer-diff-row">
                  {DIFFICULTY_LEVELS.map(d => (
                    <button
                      key={d}
                      className={`footer-diff${difficulty === d ? ' active' : ''}`}
                      onClick={() => setDifficulty(d)}
                      style={{ color: theme.ui }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="footer-actions">
                  <button
                    className="footer-action-btn"
                    onClick={mode === 'gomoku' ? newGame : penteNewGame}
                    style={{ color: theme.ui }}
                  >
                    new game
                  </button>
                  <button
                    className="footer-action-btn"
                    onClick={mode === 'gomoku' ? undo : penteUndo}
                    style={{ color: theme.ui }}
                  >
                    undo
                  </button>
                </div>
              </div>
              <div className="footer-note" style={{ color: theme.ui }}>
                {theme.inkName} · {mode === 'gomoku' ? `${gridSize}×${gridSize}` : '15×15'} · v1.3
                {'  '}
                <button
                  className="reset-stats-link"
                  onClick={mode === 'gomoku' ? resetStats : penteResetStats}
                  style={{ color: theme.ui }}
                >
                  reset stats
                </button>
              </div>
            </div>
          </div>

          {/* ── Sidebar (stats only) ──────────────────────────────────── */}
          {mode === 'gomoku' && (
            <MarginNotes
              theme={theme}
              sessionStats={sessionStats}
              settings={settings}
              gameOpenThreesX={gameOpenThreesX}
              onTogglePatterns={toggleShowPatterns}
              onToggleReference={toggleReference}
            />
          )}
          {mode === 'pente' && (
            <PenteMarginNotes
              theme={theme}
              penteState={penteState}
              sessionStats={penteSessionStats}
              settings={penteSettings}
              threatsX={penteThreats.X}
              threatsO={penteThreats.O}
              vulnX={penteVuln.pairsX.length}
              vulnO={penteVuln.pairsO.length}
              gameOpenThreesX={penteGameOpenThreesX}
              onTogglePatterns={penteToggleShowPatterns}
              onToggleReference={penteToggleReference}
            />
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
