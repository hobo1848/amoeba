import { useLayoutEffect, useRef } from 'react';
import type { DetectedShape } from '../game/patterns';
import type { BlockedThreatAnim, OutlineVariant } from '../game/usePatternStats';
import type { Aesthetic } from '../tokens';
import { seedFor, patternOvalPaths } from '../roughPaths';

interface Props {
  shapes: DetectedShape[];
  forkShapeKeys: Set<string>;
  blockedAnim: BlockedThreatAnim | null;
  cellPx: number;
  pad: number;
  theme: Aesthetic;
  variant: OutlineVariant;
}

export function PatternOutlines({ shapes, forkShapeKeys, blockedAnim, cellPx, pad, theme, variant }: Props) {
  const gRef = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    const g = gRef.current;
    if (!g) return;
    g.innerHTML = '';

    for (const shape of shapes) {
      const isFork = forkShapeKeys.has(shape.key);
      const strokeW = isFork ? 1.8 : 1.1;
      const color = shape.player === 'X' ? theme.x : theme.o;
      const first = shape.cells[0];
      const last = shape.cells[shape.cells.length - 1];

      const cellCenter = (r: number, c: number) => ({
        x: pad + c * cellPx + cellPx / 2,
        y: pad + r * cellPx + cellPx / 2,
      });

      const a = cellCenter(first.row, first.col);
      const b = cellCenter(last.row, last.col);
      const halfWidth = cellPx * 0.44;
      const seed = seedFor(first.row, first.col, shape.dir[0] * 7 + shape.dir[1]);

      const strokeLineDash: [number, number] | undefined =
        variant === 'A' && shape.player === 'O' ? [5, 4] : undefined;

      const paths = patternOvalPaths(a, b, halfWidth, color, strokeW, seed, strokeLineDash);

      for (const pp of paths) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', pp.d);
        el.setAttribute('stroke', color);
        el.setAttribute('stroke-width', String(strokeW));
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        if (strokeLineDash) el.setAttribute('stroke-dasharray', strokeLineDash.join(' '));
        if (variant === 'B' && shape.player === 'O') el.setAttribute('opacity', '0.6');
        el.style.animation = 'patternFadeIn 300ms ease both';
        g.appendChild(el);
      }
    }

    // Blocked-threat slash.
    if (blockedAnim && blockedAnim.opacity > 0) {
      const cx = pad + blockedAnim.col * cellPx + cellPx / 2;
      const cy = pad + blockedAnim.row * cellPx + cellPx / 2;
      const slashHalf = cellPx * 0.28;
      const color = blockedAnim.player === 'X' ? theme.x : theme.o;

      if (variant === 'A' && blockedAnim.player === 'O') {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        el.setAttribute('x1', String(cx - slashHalf));
        el.setAttribute('y1', String(cy + slashHalf));
        el.setAttribute('x2', String(cx + slashHalf));
        el.setAttribute('y2', String(cy - slashHalf));
        el.setAttribute('stroke', color);
        el.setAttribute('stroke-width', '1.2');
        el.setAttribute('stroke-dasharray', '3 2');
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('opacity', String(blockedAnim.opacity));
        el.style.transition = 'opacity 1500ms ease';
        g.appendChild(el);
      } else {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        el.setAttribute('x1', String(cx - slashHalf));
        el.setAttribute('y1', String(cy + slashHalf));
        el.setAttribute('x2', String(cx + slashHalf));
        el.setAttribute('y2', String(cy - slashHalf));
        el.setAttribute('stroke', color);
        el.setAttribute('stroke-width', '1.2');
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('opacity', String(blockedAnim.opacity));
        el.style.transition = 'opacity 1500ms ease';
        g.appendChild(el);
      }
    }
  }, [shapes, forkShapeKeys, blockedAnim, cellPx, pad, theme, variant]);

  return <g ref={gRef} />;
}
