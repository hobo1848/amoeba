import { useLayoutEffect, useRef } from 'react';
import type { Aesthetic } from '../tokens';
import { xPaths, oPaths, seedFor } from '../roughPaths';
import { TIMINGS } from '../tokens';
import type { Player } from '../game/checkWin';

interface Props {
  kind: Player;
  cx: number;
  cy: number;
  size: number;
  theme: Aesthetic;
  roughness01: number;
  row: number;
  col: number;
  animate: boolean;
}

export function Mark({ kind, cx, cy, size, theme, roughness01, row, col, animate }: Props) {
  const gRef = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    const g = gRef.current;
    if (!g) return;
    g.innerHTML = '';
    const color = kind === 'X' ? theme.x : theme.o;
    const seed = seedFor(row, col);
    const paths = kind === 'X'
      ? xPaths(cx, cy, size, color, roughness01, seed)
      : oPaths(cx, cy, size, color, roughness01, seed);

    paths.forEach((pp, i) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('d', pp.d);
      el.setAttribute('stroke', color);
      el.setAttribute('stroke-width', '2.1');
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-linejoin', 'round');
      if (animate) {
        try {
          const len = el.getTotalLength?.() ?? 120;
          el.style.strokeDasharray = `${len}`;
          el.style.strokeDashoffset = `${len}`;
          el.style.transition = `stroke-dashoffset ${TIMINGS.markDrawMs}ms cubic-bezier(.55,.2,.3,1) ${i * TIMINGS.markDrawMs * 0.45}ms`;
          requestAnimationFrame(() => requestAnimationFrame(() => {
            el.style.strokeDashoffset = '0';
          }));
        } catch { /* no-op */ }
      }
      g.appendChild(el);
    });
  }, [kind, cx, cy, size, theme, roughness01, row, col, animate]);

  return <g ref={gRef} />;
}
