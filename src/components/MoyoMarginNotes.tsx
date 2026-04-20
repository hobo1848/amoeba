import type { Aesthetic, Difficulty } from '../tokens';
import type { MoyoState } from '../game/useMoyo';
import type { MoyoPatternCounts } from '../game/moyoPatterns';
import { MOYO_MOVES_PER_SIDE } from '../game/moyoLogic';
import { TurnIndicator } from './TurnIndicator';
import { DifficultyPicker } from './DifficultyPicker';
import { RoughButton } from './RoughButton';

interface Props {
  theme: Aesthetic;
  state: MoyoState;
  boardSize: number;
  thinking: boolean;
  difficulty: Difficulty;
  patterns: MoyoPatternCounts;
  showPatterns: boolean;
  referenceOpen: boolean;
  onDifficulty: (d: Difficulty) => void;
  onNewGame: () => void;
  onUndo: () => void;
  onTogglePatterns: () => void;
  onToggleReference: () => void;
}

export function MoyoMarginNotes({
  theme, state, boardSize, thinking, difficulty, patterns,
  showPatterns, referenceOpen,
  onDifficulty, onNewGame, onUndo, onTogglePatterns, onToggleReference,
}: Props) {
  const { territory, movesX, movesO, gameOver } = state;
  const remainX = MOYO_MOVES_PER_SIDE - movesX;
  const remainO = MOYO_MOVES_PER_SIDE - movesO;

  return (
    <aside className="margin" style={{ color: theme.ui }}>
      <div>
        <h1>Amőba</h1>
        <div className="sub">moyo · territory</div>
      </div>

      {!gameOver && (
        <TurnIndicator turn={state.turn} thinking={thinking} theme={theme} />
      )}

      {/* ── Live territory scores ─────────────────────────────── */}
      <div className="note-block">
        <div className="note-label">Territory</div>
        <div className="shape-stats">
          <div className="shape-row shape-row--header">
            <span />
            <span className="shape-col-head">X</span>
            <span className="shape-col-head">O</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Enclosed</span>
            <span className="shape-val">{territory.xTerritory}</span>
            <span className="shape-val">{territory.oTerritory}</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Contested</span>
            <span className="shape-val moyo-shared">{territory.contested}</span>
            <span className="shape-val moyo-shared" />
          </div>
          <div className="shape-row">
            <span className="shape-label">Neutral</span>
            <span className="shape-val moyo-shared">{territory.neutral}</span>
            <span className="shape-val moyo-shared" />
          </div>
        </div>

        {/* ── Moves remaining ──────────────────────────────────── */}
        <div className="shape-stats" style={{ marginTop: 8 }}>
          <div className="shape-row shape-row--header">
            <span />
            <span className="shape-col-head">X</span>
            <span className="shape-col-head">O</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Moves left</span>
            <span className="shape-val" style={{ opacity: remainX === 0 ? 0.35 : 1 }}>
              {remainX}
            </span>
            <span className="shape-val" style={{ opacity: remainO === 0 ? 0.35 : 1 }}>
              {remainO}
            </span>
          </div>
        </div>
      </div>

      {/* ── Pattern recognition ───────────────────────────────── */}
      <div className="note-block">
        <div className="shape-stats">
          <div className="shape-row shape-row--header">
            <span />
            <span className="shape-col-head">X</span>
            <span className="shape-col-head">O</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Corners</span>
            <span className="shape-val">{patterns.cornersSecured.X}</span>
            <span className="shape-val">{patterns.cornersSecured.O}</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Walls</span>
            <span className="shape-val">{patterns.walls.X}</span>
            <span className="shape-val">{patterns.walls.O}</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Invasions</span>
            <span className="shape-val">{patterns.invasions.X}</span>
            <span className="shape-val">{patterns.invasions.O}</span>
          </div>
          <div className="shape-row">
            <span className="shape-label">Weak groups</span>
            <span className="shape-val">{patterns.weakGroups.X}</span>
            <span className="shape-val">{patterns.weakGroups.O}</span>
          </div>
        </div>

        {/* ── Show patterns toggle ─────────────────────────────── */}
        <div className="patterns-toggle-row">
          <button
            className={`patterns-toggle ${showPatterns ? 'on' : 'off'}`}
            onClick={onTogglePatterns}
            style={{ color: theme.ui }}
            aria-pressed={showPatterns}
          >
            Show patterns: <span className="toggle-state">{showPatterns ? 'on' : 'off'}</span>
          </button>
        </div>

        <button
          className="reference-toggle"
          onClick={onToggleReference}
          style={{ color: theme.ui }}
        >
          {referenceOpen ? '▲ ' : ''}What gets recognized?
        </button>

        {referenceOpen && (
          <div className="pattern-reference">
            <div className="ref-entry">
              <div className="ref-name">Corners secured</div>
              <div className="ref-desc">Small enclosed regions touching a board corner. Corner control is worth extra in territory games.</div>
              <div className="ref-diagram">X X _<br />X _ _<br />_ _ _</div>
            </div>
            <div className="ref-entry">
              <div className="ref-name">Walls</div>
              <div className="ref-desc">Three or more same-color stones in a straight line. Walls fence off territory efficiently.</div>
              <div className="ref-diagram">_ X X X _</div>
            </div>
            <div className="ref-entry">
              <div className="ref-name">Invasions</div>
              <div className="ref-desc">A stone placed deep inside a region dominated by the opponent's stones — bold but risky.</div>
              <div className="ref-diagram">O O O<br />O X O<br />O O _</div>
            </div>
            <div className="ref-entry">
              <div className="ref-name">Weak groups</div>
              <div className="ref-desc">Isolated stones with only one or no friendly neighbor. Vulnerable to being cut off.</div>
              <div className="ref-diagram">X _ _ X</div>
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
        {theme.inkName} · {boardSize}×{boardSize} · v1.2
      </div>
    </aside>
  );
}
