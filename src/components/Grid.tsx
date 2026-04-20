import { useLayoutEffect, useRef } from 'react';
import rough from 'roughjs';
import type { Aesthetic } from '../tokens';
import { gridRectOpts, gridLineOpts } from '../roughPaths';

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
    g.appendChild(rc.rectangle(ox, oy, boardPx, boardPx, gridRectOpts(theme.grid)));
    for (let i = 1; i < gridSize; i++) {
      const y = oy + i * cellPx;
      g.appendChild(rc.line(ox + 2, y, ox + boardPx - 2, y, gridLineOpts(theme.grid, 100 + i)));
    }
    for (let i = 1; i < gridSize; i++) {
      const x = ox + i * cellPx;
      g.appendChild(rc.line(x, oy + 2, x, oy + boardPx - 2, gridLineOpts(theme.grid, 200 + i)));
    }
    g.setAttribute('opacity', String(theme.gridOpacity));
  }, [theme, gridSize, cellPx, boardPx, pad, offsetX, offsetY, svgEl]);

  return <g ref={ref} />;
}
