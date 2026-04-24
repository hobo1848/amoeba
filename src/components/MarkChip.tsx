import { useLayoutEffect, useRef } from 'react';
import rough from 'roughjs';
import type { Aesthetic } from '../tokens';
import type { Player } from '../game/checkWin';

interface Props {
  kind: Player;
  theme: Aesthetic;
  size?: number;
}

export function MarkChip({ kind, theme, size = 32 }: Props) {
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
