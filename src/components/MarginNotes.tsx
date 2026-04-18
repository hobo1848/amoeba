import type { Aesthetic, Difficulty, GridSize } from '../tokens';
import type { GameState } from '../game/useGame';
import { TurnIndicator } from './TurnIndicator';
import { DifficultyPicker } from './DifficultyPicker';
import { RoughButton } from './RoughButton';

interface Props {
  theme: Aesthetic;
  state: GameState;
  gridSize: GridSize;
  xWins: number;
  oWins: number;
  thinking: boolean;
  difficulty: Difficulty;
  onDifficulty: (d: Difficulty) => void;
  onNewGame: () => void;
  onUndo: () => void;
}

export function MarginNotes({
  theme, state, gridSize, xWins, oWins,
  thinking, difficulty, onDifficulty, onNewGame, onUndo,
}: Props) {
  return (
    <aside className="margin" style={{ color: theme.ui }}>
      <div>
        <h1>Amőba</h1>
        <div className="sub">öt-öt · five in a row</div>
      </div>

      <TurnIndicator turn={state.turn} thinking={thinking} theme={theme} />

      <div className="note-block">
        <div className="note-label">Score</div>
        <div className="stats">
          <div className="stat">
            <div className="n">{xWins}</div>
            <div className="l">X (you)</div>
          </div>
          <div className="stat">
            <div className="n">{oWins}</div>
            <div className="l">O (cpu)</div>
          </div>
          <div className="stat">
            <div className="n">{state.moves}</div>
            <div className="l">moves</div>
          </div>
          <div className="stat">
            <div className="n">{gridSize}×{gridSize}</div>
            <div className="l">board</div>
          </div>
        </div>
      </div>

      <DifficultyPicker difficulty={difficulty} onChange={onDifficulty} />

      <div className="note-block">
        <div className="note-label">Actions</div>
        <div className="btn-row">
          <RoughButton label="New game" onClick={onNewGame} color={theme.ui} w={120} h={38} />
          <RoughButton label="Undo" onClick={onUndo} color={theme.ui} w={90} h={38} />
        </div>
      </div>

      <div className="footer-note">{theme.inkName} · {gridSize}×{gridSize} · v1.0</div>
    </aside>
  );
}
