import type { Difficulty } from '../tokens';

interface Props {
  difficulty: Difficulty;
  onChange: (d: Difficulty) => void;
}

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];

export function DifficultyPicker({ difficulty, onChange }: Props) {
  return (
    <div className="note-block">
      <div className="note-label">Difficulty</div>
      <div className="diff-row">
        {LEVELS.map(d => (
          <button
            key={d}
            className={`diff${difficulty === d ? ' active' : ''}`}
            onClick={() => onChange(d)}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}
