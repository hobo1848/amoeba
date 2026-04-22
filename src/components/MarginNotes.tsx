import { useState, useLayoutEffect, useRef } from 'react';
import rough from 'roughjs';
import type { Aesthetic } from '../tokens';
import type { Player } from '../game/checkWin';
import type { SessionStats, PatternSettings } from '../game/usePatternStats';

interface Props {
  theme: Aesthetic;
  turn: Player;
  thinking: boolean;
  sessionStats: SessionStats;
  settings: PatternSettings;
  gameOpenThreesX: number;
  onTogglePatterns: () => void;
  onToggleReference: () => void;
}

function MarkChip({ kind, theme, size = 32 }: { kind: Player; theme: Aesthetic; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.innerHTML = '';
    const rc = rough.svg(svg);
    const color = kind === 'X' ? theme.x : theme.o;
    if (kind === 'X') {
      svg.appendChild(rc.line(7, 7, size - 7, size - 7, { stroke: color, strokeWidth: 2.2, roughness: 1.2, seed: 3 }));
      svg.appendChild(rc.line(size - 7, 7, 7, size - 7, { stroke: color, strokeWidth: 2.2, roughness: 1.2, seed: 5 }));
    } else {
      svg.appendChild(rc.arc(size / 2, size / 2, size - 12, size - 12, -0.2 * Math.PI, 2 * Math.PI - 0.1, false, {
        stroke: color, strokeWidth: 2.2, roughness: 1.2, seed: 7,
      }));
    }
  }, [kind, theme, size]);
  return <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} />;
}

export function MarginNotes({
  theme, turn, thinking, sessionStats, settings, gameOpenThreesX,
  onTogglePatterns, onToggleReference,
}: Props) {
  const { openThrees, fours, forks, blocked, gamesPlayed, sessionWins, xOpenThreesHistory } = sessionStats;
  const [patternsOpen, setPatternsOpen] = useState(false);

  const avgOT = xOpenThreesHistory.length > 0
    ? (xOpenThreesHistory.reduce((a, b) => a + b, 0) / xOpenThreesHistory.length).toFixed(1)
    : null;

  const patternSummary = `${openThrees.X + fours.X + forks.X} · ${openThrees.O + fours.O + forks.O}`;

  return (
    <aside className="rail" style={{ color: theme.ui }}>

      {/* Turn */}
      <div className="rail-section">
        <div className="rail-label">Turn</div>
        <div className="turn">
          <div className="turn-chip">
            <MarkChip kind={turn} theme={theme} size={32} />
          </div>
          <div>
            <div className="turn-text">
              {turn === 'X' ? 'Your move' : (thinking ? 'Thinking…' : 'Opponent')}
            </div>
            <div className="turn-sub">
              {turn === 'X' ? 'place an X' : 'CPU is playing'}
            </div>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="rail-section">
        <div className="rail-label">Score</div>
        <div className="score-pair">
          <div className="score-cell">
            <div className="n">{sessionWins.X}</div>
            <div className="l">X · you</div>
          </div>
          <div className="score-cell">
            <div className="n">{sessionWins.O}</div>
            <div className="l">O · cpu</div>
          </div>
        </div>
      </div>

      {/* Patterns (collapsible) */}
      <div className="rail-section">
        <div
          className={`rail-label clickable${patternsOpen ? ' open' : ''}`}
          onClick={() => setPatternsOpen(o => !o)}
        >
          <span className="rail-label-chev">▸</span>
          <span>Patterns</span>
          {!patternsOpen && (
            <span className="rail-label-summary">{patternSummary}</span>
          )}
        </div>
        <div className={`collapse-body${patternsOpen ? ' open' : ''}`}>
          <div className="stat-grid">
            <span />
            <span className="sg-head">X</span>
            <span className="sg-head">O</span>

            <span className="sg-label">Open threes</span>
            <span className="sg-val">{openThrees.X}</span>
            <span className="sg-val">{openThrees.O}</span>

            <span className="sg-label">Fours</span>
            <span className="sg-val">{fours.X}</span>
            <span className="sg-val">{fours.O}</span>

            <span className="sg-label">Forks</span>
            <span className="sg-val">{forks.X}</span>
            <span className="sg-val">{forks.O}</span>

            <span className="sg-label">Blocked</span>
            <span className="sg-val sg-val--muted">{blocked.X}</span>
            <span className="sg-val sg-val--muted">{blocked.O}</span>
          </div>

          {(gameOpenThreesX > 0 || gamesPlayed > 0) && (
            <div className="this-game-line">
              this game {gameOpenThreesX} open three{gameOpenThreesX !== 1 ? 's' : ''}
              {avgOT !== null && ` · avg ${avgOT}`}
            </div>
          )}

          <button
            className={`patterns-toggle${settings.showPatterns ? ' on' : ''}`}
            onClick={onTogglePatterns}
            style={{ color: theme.ui }}
            aria-pressed={settings.showPatterns}
          >
            Show on board: {settings.showPatterns ? 'on' : 'off'}
          </button>

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
                  <span>{'  '}X</span>
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
      </div>
    </aside>
  );
}
