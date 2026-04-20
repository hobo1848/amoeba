import { useLayoutEffect, useRef } from 'react';
import rough from 'roughjs';
import type { Aesthetic } from '../tokens';
import type { Player } from '../game/checkWin';

interface ChipProps {
  kind: Player;
  theme: Aesthetic;
  size?: number;
}

function MarkChip({ kind, theme, size = 36 }: ChipProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.innerHTML = '';
    const rc = rough.svg(svg);
    const color = kind === 'X' ? theme.x : theme.o;
    if (kind === 'X') {
      svg.appendChild(rc.line(8, 8, size - 8, size - 8, { stroke: color, strokeWidth: 2.2, roughness: 1.2, seed: 3 }));
      svg.appendChild(rc.line(size - 8, 8, 8, size - 8, { stroke: color, strokeWidth: 2.2, roughness: 1.2, seed: 5 }));
    } else {
      svg.appendChild(rc.arc(size / 2, size / 2, size - 14, size - 14, -0.2 * Math.PI, 2 * Math.PI - 0.1, false, {
        stroke: color, strokeWidth: 2.2, roughness: 1.2, seed: 7,
      }));
    }
  }, [kind, theme, size]);

  return <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} />;
}

interface Props {
  turn: Player;
  thinking: boolean;
  theme: Aesthetic;
  compact?: boolean;
}

export function TurnIndicator({ turn, thinking, theme, compact }: Props) {
  if (compact) {
    return (
      <div className="turn-compact">
        <MarkChip kind={turn} theme={theme} size={26} />
        <div className="turn-compact-text">
          {turn === 'X' ? 'Your move' : (thinking ? 'Thinking…' : 'Opponent')}
        </div>
      </div>
    );
  }
  return (
    <div className="note-block">
      <div className="note-label">Turn</div>
      <div className="turn-row">
        <div className="turn-chip">
          <MarkChip kind={turn} theme={theme} />
        </div>
        <div>
          <div className="turn-text">
            {turn === 'X' ? 'Your move' : (thinking ? 'Thinking…' : 'Opponent')}
          </div>
          <div style={{ fontSize: 10, opacity: 0.55, letterSpacing: '0.1em', marginTop: 2 }}>
            {turn === 'X' ? 'Place an X' : 'CPU is thinking'}
          </div>
        </div>
      </div>
    </div>
  );
}
