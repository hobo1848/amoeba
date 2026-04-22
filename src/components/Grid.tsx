import { useLayoutEffect, useRef } from 'react';
import rough from 'roughjs';
import type { Aesthetic } from '../tokens';
import { gridLineOpts } from '../roughPaths';

interface Props {
  theme: Aesthetic;
  gridSize: number;
  cellPx: number;
  boardPx: number;
  pad: number;
  offsetX?: number;
  offsetY?: number;
  svgEl: SVGSVGElement | null;
}

export function Grid({ theme, gridSize, cellPx, boardPx, pad, offsetX = 0, offsetY = 0, svgEl }: Props) {
  const ref = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    const g = ref.current;
    if (!g || !svgEl) return;
    g.innerHTML = '';
    const rc = rough.svg(svgEl);
    const ox = pad + offsetX, oy = pad + offsetY;
    for (let i = 0; i <= gridSize; i++) {
      const y = oy + i * cellPx;
      g.appendChild(rc.line(ox, y, ox + boardPx, y, gridLineOpts(theme.grid, 100 + i)));
    }
    for (let i = 0; i <= gridSize; i++) {
      const x = ox + i * cellPx;
      g.appendChild(rc.line(x, oy, x, oy + boardPx, gridLineOpts(theme.grid, 200 + i)));
    }
    g.setAttribute('opacity', String(theme.gridOpacity));
  }, [theme, gridSize, cellPx, boardPx, pad, offsetX, offsetY, svgEl]);

  return <g ref={ref} />;
}
