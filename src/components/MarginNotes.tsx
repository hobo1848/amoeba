import type { Aesthetic } from '../tokens';
import type { SessionStats, PatternSettings } from '../game/usePatternStats';

interface Props {
  theme: Aesthetic;
  sessionStats: SessionStats;
  settings: PatternSettings;
  gameOpenThreesX: number;
  onTogglePatterns: () => void;
  onToggleReference: () => void;
}

export function MarginNotes({
  theme, sessionStats, settings, gameOpenThreesX,
  onTogglePatterns, onToggleReference,
}: Props) {
  const { openThrees, fours, forks, blocked, gamesPlayed, xOpenThreesHistory } = sessionStats;

  const avgOT = xOpenThreesHistory.length > 0
    ? (xOpenThreesHistory.reduce((a, b) => a + b, 0) / xOpenThreesHistory.length).toFixed(1)
    : null;

  return (
    <aside className="margin" style={{ color: theme.ui }}>
      <div className="note-block note-block--first">
        <div className="note-label">Patterns</div>
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

        {(gameOpenThreesX > 0 || gamesPlayed > 0) && (
          <div className="this-game-line">
            this game {gameOpenThreesX} open three{gameOpenThreesX !== 1 ? 's' : ''}
            {avgOT !== null && ` · avg ${avgOT}`}
          </div>
        )}

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

        <button
          className="reference-toggle"
          onClick={onToggleReference}
          style={{ color: theme.ui }}
        >
          {settings.referenceOpen ? '▲ ' : ''}what gets recognized?
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
    </aside>
  );
}
