import { useLayoutEffect, useRef } from 'react';
import rough from 'roughjs';
import type { DetectedShape } from '../game/patterns';
import type { BlockedThreatAnim, OutlineVariant } from '../game/usePatternStats';
import type { Aesthetic } from '../tokens';
import { seedFor } from '../roughPaths';

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
    const svg = g.ownerSVGElement;
    if (!svg) return;
    g.innerHTML = '';

    const rc = rough.svg(svg as SVGSVGElement);

    for (const shape of shapes) {
      const isFork = forkShapeKeys.has(shape.key);
      const strokeW = isFork ? 2.0 : 1.2;
      const color = shape.player === 'X' ? theme.x : theme.o;
      const first = shape.cells[0];
      const last = shape.cells[shape.cells.length - 1];

      const margin = cellPx * 0.08;
      const seed = seedFor(first.row, first.col, shape.dir[0] * 7 + shape.dir[1]);

      // Dashes for variant A O-shapes; opacity for variant B O-shapes.
      const strokeLineDash: [number, number] | undefined =
        variant === 'A' && shape.player === 'O' ? [5, 4] : undefined;

      const opts = {
        stroke: color,
        strokeWidth: strokeW,
        fill: 'none',
        roughness: 0.9,
        bowing: 0.6,
        seed,
        strokeLineDash,
      };

      const [dr, dc] = shape.dir;
      const isDiagonal = dr !== 0 && dc !== 0;
      let node: Element;

      if (isDiagonal) {
        // Tight parallelogram: TL/TR of first cell, BR/BL of last cell.
        const fx = pad + first.col * cellPx;
        const fy = pad + first.row * cellPx;
        const lx = pad + last.col * cellPx;
        const ly = pad + last.row * cellPx;
        node = rc.polygon([
          [fx + margin,          fy + margin],
          [fx + cellPx - margin, fy + margin],
          [lx + cellPx - margin, ly + cellPx - margin],
          [lx + margin,          ly + cellPx - margin],
        ], opts);
      } else {
        const minCol = Math.min(first.col, last.col);
        const maxCol = Math.max(first.col, last.col);
        const minRow = Math.min(first.row, last.row);
        const maxRow = Math.max(first.row, last.row);
        const x1 = pad + minCol * cellPx + margin;
        const y1 = pad + minRow * cellPx + margin;
        const w = (maxCol - minCol + 1) * cellPx - 2 * margin;
        const h = (maxRow - minRow + 1) * cellPx - 2 * margin;
        node = rc.rectangle(x1, y1, w, h, opts);
      }

      if (variant === 'B' && shape.player === 'O') {
        node.setAttribute('opacity', '0.6');
      }
      node.style.animation = 'patternFadeIn 300ms ease both';
      g.appendChild(node);
    }

    // Blocked-threat slash.
    if (blockedAnim && blockedAnim.opacity > 0) {
      const cx = pad + blockedAnim.col * cellPx + cellPx / 2;
      const cy = pad + blockedAnim.row * cellPx + cellPx / 2;
      const slashHalf = cellPx * 0.28;
      const color = blockedAnim.player === 'X' ? theme.x : theme.o;

      if (variant === 'A' && blockedAnim.player === 'O') {
        // Dashed slash for O.
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
