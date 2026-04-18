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
  svgEl: SVGSVGElement | null;
}

export function Grid({ theme, gridSize, cellPx, boardPx, pad, svgEl }: Props) {
  const ref = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    const g = ref.current;
    if (!g || !svgEl) return;
    g.innerHTML = '';
    const rc = rough.svg(svgEl);
    g.appendChild(rc.rectangle(pad, pad, boardPx, boardPx, gridRectOpts(theme.grid)));
    for (let i = 1; i < gridSize; i++) {
      const y = pad + i * cellPx;
      g.appendChild(rc.line(pad + 2, y, pad + boardPx - 2, y, gridLineOpts(theme.grid, 100 + i)));
    }
    for (let i = 1; i < gridSize; i++) {
      const x = pad + i * cellPx;
      g.appendChild(rc.line(x, pad + 2, x, pad + boardPx - 2, gridLineOpts(theme.grid, 200 + i)));
    }
    g.setAttribute('opacity', String(theme.gridOpacity));
  }, [theme, gridSize, cellPx, boardPx, pad, svgEl]);

  return <g ref={ref} />;
}
