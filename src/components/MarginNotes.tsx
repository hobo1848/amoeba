import type { Aesthetic, Difficulty, GridSize } from '../tokens';
import type { GameState } from '../game/useGame';
import type { SessionStats, PatternSettings } from '../game/usePatternStats';
import { TurnIndicator } from './TurnIndicator';
import { DifficultyPicker } from './DifficultyPicker';
import { RoughButton } from './RoughButton';

interface Props {
  theme: Aesthetic;
  state: GameState;
  gridSize: GridSize;
  sessionStats: SessionStats;
  settings: PatternSettings;
  thinking: boolean;
  difficulty: Difficulty;
  onDifficulty: (d: Difficulty) => void;
  onNewGame: () => void;
  onUndo: () => void;
  onTogglePatterns: () => void;
  onToggleReference: () => void;
  onResetStats: () => void;
  gameOpenThreesX: number;
}

export function MarginNotes({
  theme, state, gridSize,
  sessionStats, settings,
  thinking, difficulty, onDifficulty, onNewGame, onUndo,
  onTogglePatterns, onToggleReference, onResetStats,
  gameOpenThreesX,
}: Props) {
  const { sessionWins, openThrees, fours, forks, blocked, gamesPlayed, xOpenThreesHistory } = sessionStats;

  const avgOT = xOpenThreesHistory.length > 0
    ? (xOpenThreesHistory.reduce((a, b) => a + b, 0) / xOpenThreesHistory.length).toFixed(1)
    : null;

  return (
    <aside className="margin" style={{ color: theme.ui }}>
      <div>
        <h1>Amőba</h1>
        <div className="sub">öt-öt · five in a row</div>
      </div>

      <TurnIndicator turn={state.turn} thinking={thinking} theme={theme} />

      {/* ── Score ─────────────────────────────────────────────────── */}
      <div className="note-block">
        <div className="note-label">Score</div>
        <div className="stats">
          <div className="stat">
            <div className="n">{sessionWins.X}</div>
            <div className="l">X (you)</div>
          </div>
          <div className="stat">
            <div className="n">{sessionWins.O}</div>
            <div className="l">O (cpu)</div>
          </div>
        </div>

        {/* ── Shape counters ───────────────────────────────────────── */}
        <div className="shape-stats">
          <div className="shape-row shape-row--header">
            <span />
            <span className="shape-col-head">X</span>
            <span className="shape-col-head">O</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Open threes</span>
            <span className="shape-val">{openThrees.X}</span>
            <span className="shape-val">{openThrees.O}</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Fours</span>
            <span className="shape-val">{fours.X}</span>
            <span className="shape-val">{fours.O}</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Forks</span>
            <span className="shape-val">{forks.X}</span>
            <span className="shape-val">{forks.O}</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Blocked</span>
            <span className="shape-val">{blocked.X}</span>
            <span className="shape-val">{blocked.O}</span>
          </div>
        </div>

        {/* ── This game / avg ──────────────────────────────────────── */}
        {(gameOpenThreesX > 0 || gamesPlayed > 0) && (
          <div className="this-game-line">
            this game {gameOpenThreesX} open three{gameOpenThreesX !== 1 ? 's' : ''}
            {avgOT !== null && ` · avg ${avgOT}`}
          </div>
        )}

        {/* ── Show patterns toggle ─────────────────────────────────── */}
        <div className="patterns-toggle-row">
          <button
            className={`patterns-toggle ${settings.showPatterns ? 'on' : 'off'}`}
            onClick={onTogglePatterns}
            style={{ color: theme.ui }}
            aria-pressed={settings.showPatterns}
          >
            Show patterns: <span className="toggle-state">{settings.showPatterns ? 'on' : 'off'}</span>
          </button>
        </div>

        {/* ── What gets recognised? ────────────────────────────────── */}
        <button
          className="reference-toggle"
          onClick={onToggleReference}
          style={{ color: theme.ui }}
        >
          {settings.referenceOpen ? '▲ ' : ''}What gets recognized?
        </button>

        {settings.referenceOpen && (
          <div className="pattern-reference">
            <div className="ref-entry">
              <div className="ref-name">Open three</div>
              <div className="ref-desc">Three marks in a row with both ends empty. Either player can extend it toward five on the next move.</div>
              <div className="ref-diagram">_ X X X _</div>
            </div>
            <div className="ref-entry">
              <div className="ref-name">Four</div>
              <div className="ref-desc">Four consecutive marks with at least one open end. One move away from winning — block or lose.</div>
              <div className="ref-diagram">_ X X X X</div>
            </div>
            <div className="ref-entry">
              <div className="ref-name">Fork</div>
              <div className="ref-desc">A single move that creates two or more threats at once. Impossible to block both simultaneously.</div>
              <div className="ref-diagram">
                <span>_ X X _</span>
                <br />
                <span>  X</span>
                <br />
                <span>_ X _</span>
              </div>
            </div>
            <div className="ref-entry">
              <div className="ref-name">Blocked threat</div>
              <div className="ref-desc">Placing on the critical extension square of an opponent's open three or four, neutralising the threat.</div>
              <div className="ref-diagram">O O O _ → O O O X</div>
            </div>
          </div>
        )}
      </div>

      <DifficultyPicker difficulty={difficulty} onChange={onDifficulty} />

      <div className="note-block">
        <div className="note-label">Actions</div>
        <div className="btn-row">
          <RoughButton label="New game" onClick={onNewGame} color={theme.ui} w={120} h={38} />
          <RoughButton label="Undo" onClick={onUndo} color={theme.ui} w={90} h={38} />
        </div>
      </div>

      <div className="footer-note">
        {theme.inkName} · {gridSize}×{gridSize} · v1.1
        {'  '}
        <button className="reset-stats-link" onClick={onResetStats} style={{ color: theme.ui }}>
          reset stats
        </button>
      </div>
    </aside>
  );
}
