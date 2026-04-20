import { useState, useEffect, useRef, useCallback } from 'react';
import type { Board, Player } from './checkWin';
import { emptyBoard } from './checkWin';
import { detectActiveShapes, analyseMove, getForkShapes, type DetectedShape, type MovePatternEvents } from './patterns';
import type { Move } from './useGame';

// ── Persisted state ───────────────────────────────────────────────────────────

export interface SessionStats {
  openThrees: { X: number; O: number };
  fours: { X: number; O: number };
  forks: { X: number; O: number };
  blocked: { X: number; O: number };
  gamesPlayed: number; // completed games (with a winner)
  sessionWins: { X: number; O: number };
  // per-game X open-threes, stored for average calculation
  xOpenThreesHistory: number[];
}

export interface PatternSettings {
  showPatterns: boolean;
  referenceOpen: boolean;
}

const STATS_KEY = 'amoba_pattern_stats';
const SETTINGS_KEY = 'amoba_pattern_settings';

// Dev-only: 'A' = solid X / dashed O, 'B' = solid both / opacity-60 O
export type OutlineVariant = 'A' | 'B';
function getOutlineVariant(): OutlineVariant {
  try {
    const v = localStorage.getItem('amoba_outline_variant');
    if (v === 'B') return 'B';
  } catch { /* no-op */ }
  return 'A';
}

function loadStats(): SessionStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw) as SessionStats;
  } catch { /* no-op */ }
  return emptyStats();
}

function saveStats(s: SessionStats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* no-op */ }
}

function loadSettings(): PatternSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as PatternSettings;
  } catch { /* no-op */ }
  return { showPatterns: true, referenceOpen: false };
}

function saveSettings(s: PatternSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* no-op */ }
}

function emptyStats(): SessionStats {
  return {
    openThrees: { X: 0, O: 0 },
    fours: { X: 0, O: 0 },
    forks: { X: 0, O: 0 },
    blocked: { X: 0, O: 0 },
    gamesPlayed: 0,
    sessionWins: { X: 0, O: 0 },
    xOpenThreesHistory: [],
  };
}

function applyEvents(stats: SessionStats, events: MovePatternEvents, player: Player, delta: 1 | -1): SessionStats {
  const s = { ...stats, openThrees: { ...stats.openThrees }, fours: { ...stats.fours }, forks: { ...stats.forks }, blocked: { ...stats.blocked } };
  s.openThrees[player] = Math.max(0, s.openThrees[player] + events.openThreesCreated * delta);
  s.fours[player]      = Math.max(0, s.fours[player]      + events.foursCreated * delta);
  if (events.isFork) s.forks[player] = Math.max(0, s.forks[player] + delta);
  if (events.blocked) s.blocked[player] = Math.max(0, s.blocked[player] + delta);
  return s;
}

// ── Transient blocked-threat animation ───────────────────────────────────────

export interface BlockedThreatAnim {
  row: number;
  col: number;
  player: Player; // blocker's player (for solid/dashed style)
  opacity: number;
}

// ── Per-move record for undo ──────────────────────────────────────────────────

interface MoveRecord {
  move: Move;
  events: MovePatternEvents;
  gameOpenThreesX: number; // X open-threes as of this move (for avg)
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UsePatternStatsOpts {
  history: Move[];
  board: Board;
  gridSize: number;
  winPlayer: Player | null; // reserved for future use
}

export interface PatternStatsReturn {
  sessionStats: SessionStats;
  settings: PatternSettings;
  activeShapes: DetectedShape[];
  forkShapeKeys: Set<string>;
  blockedAnim: BlockedThreatAnim | null;
  outlineVariant: OutlineVariant;
  // Current game X open-threes (for "THIS GAME" line)
  gameOpenThreesX: number;
  // Actions
  onWin: (player: Player) => void;
  onNewGame: () => void;
  toggleShowPatterns: () => void;
  toggleReference: () => void;
  resetStats: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function usePatternStats({ history, board, gridSize, winPlayer: _winPlayer }: UsePatternStatsOpts): PatternStatsReturn {
  const [sessionStats, setSessionStats] = useState<SessionStats>(loadStats);
  const [settings, setSettings] = useState<PatternSettings>(loadSettings);
  const outlineVariant = getOutlineVariant();

  // Parallel move record history (synced to game history by length).
  const moveRecordsRef = useRef<MoveRecord[]>([]);
  // Previous board (before last move) for diff.
  const prevBoardRef = useRef<Board>(emptyBoard(gridSize));
  // Fork shapes from last move (by key).
  const [forkShapeKeys, setForkShapeKeys] = useState<Set<string>>(new Set());
  // Active shapes (computed from current board).
  const [activeShapes, setActiveShapes] = useState<DetectedShape[]>([]);
  // Blocked threat animation.
  const [blockedAnim, setBlockedAnim] = useState<BlockedThreatAnim | null>(null);
  const blockedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist stats and settings whenever they change.
  useEffect(() => { saveStats(sessionStats); }, [sessionStats]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  // React to history changes (move added or undone).
  useEffect(() => {
    const records = moveRecordsRef.current;
    const newLen = history.length;
    const oldLen = records.length;

    if (newLen > oldLen) {
      // One move was added (PLACE).
      const lastMove = history[newLen - 1];
      const boardBefore = prevBoardRef.current;
      const boardAfter = board;

      const events = analyseMove(boardBefore, boardAfter, lastMove.row, lastMove.col, lastMove.player);
      const forkShapes = getForkShapes(boardBefore, boardAfter, lastMove.row, lastMove.col, lastMove.player);

      // Game-level X open-threes counter.
      const prevGameOT = oldLen > 0 ? records[oldLen - 1].gameOpenThreesX : 0;
      const gameOpenThreesX = lastMove.player === 'X'
        ? prevGameOT + events.openThreesCreated
        : prevGameOT;

      records.push({ move: lastMove, events, gameOpenThreesX });

      setSessionStats(prev => applyEvents(prev, events, lastMove.player, 1));
      setForkShapeKeys(new Set(forkShapes.map(s => s.key)));

      // Blocked threat animation.
      if (events.blocked) {
        if (blockedTimerRef.current) clearTimeout(blockedTimerRef.current);
        setBlockedAnim({ row: lastMove.row, col: lastMove.col, player: lastMove.player, opacity: 1 });
        // Fade starts at 300ms, fully gone at 1500ms.
        blockedTimerRef.current = setTimeout(() => setBlockedAnim(null), 1500);
      } else {
        setForkShapeKeys(new Set(forkShapes.map(s => s.key)));
      }

    } else if (newLen < oldLen) {
      // One or two moves were undone.
      const removed = records.splice(newLen);
      for (const rec of removed) {
        setSessionStats(prev => applyEvents(prev, rec.events, rec.move.player, -1));
      }
      setForkShapeKeys(new Set());
      if (blockedTimerRef.current) clearTimeout(blockedTimerRef.current);
      setBlockedAnim(null);
    } else if (newLen === 0 && oldLen === 0) {
      // Game reset with no history (new game).
      // Nothing to do here; handled by onNewGame.
    }

    // Update shapes from current board.
    setActiveShapes(detectActiveShapes(board));
    // Save current board as "prev" for next move.
    prevBoardRef.current = board.map(r => r.slice());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  // Current game X open-threes.
  const records = moveRecordsRef.current;
  const gameOpenThreesX = records.length > 0 ? records[records.length - 1].gameOpenThreesX : 0;

  const onWin = useCallback((player: Player) => {
    setSessionStats(prev => {
      const sw = { ...prev.sessionWins, [player]: prev.sessionWins[player] + 1 };
      const gamesPlayed = prev.gamesPlayed + 1;
      const xOpenThreesHistory = player === 'X' || true
        ? [...prev.xOpenThreesHistory, gameOpenThreesX]
        : [...prev.xOpenThreesHistory, gameOpenThreesX];
      return { ...prev, sessionWins: sw, gamesPlayed, xOpenThreesHistory };
    });
  }, [gameOpenThreesX]);

  const onNewGame = useCallback(() => {
    moveRecordsRef.current = [];
    prevBoardRef.current = emptyBoard(gridSize);
    setForkShapeKeys(new Set());
    setActiveShapes([]);
    if (blockedTimerRef.current) clearTimeout(blockedTimerRef.current);
    setBlockedAnim(null);
  }, [gridSize]);

  const toggleShowPatterns = useCallback(() => {
    setSettings(prev => ({ ...prev, showPatterns: !prev.showPatterns }));
  }, []);

  const toggleReference = useCallback(() => {
    setSettings(prev => ({ ...prev, referenceOpen: !prev.referenceOpen }));
  }, []);

  const resetStats = useCallback(() => {
    setSessionStats(emptyStats());
    moveRecordsRef.current = [];
    setForkShapeKeys(new Set());
    try { localStorage.removeItem(STATS_KEY); } catch { /* no-op */ }
  }, []);

  return {
    sessionStats,
    settings,
    activeShapes,
    forkShapeKeys,
    blockedAnim,
    outlineVariant,
    gameOpenThreesX,
    onWin,
    onNewGame,
    toggleShowPatterns,
    toggleReference,
    resetStats,
  };
}
