import { useLayoutEffect, useRef } from 'react';
import type { Aesthetic } from '../tokens';
import { winLoopPaths, winStrikePaths } from '../roughPaths';
import { TIMINGS } from '../tokens';
import type { WinResult } from '../game/checkWin';

interface Props {
  win: WinResult;
  theme: Aesthetic;
  cellPx: number;
  pad: number;
}

export function WinDecoration({ win, theme, cellPx, pad }: Props) {
  const gRef = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    const g = gRef.current;
    if (!g) return;
    g.innerHTML = '';
    const pts = win.line.map(({ row, col }) => ({
      x: pad + col * cellPx + cellPx / 2,
      y: pad + row * cellPx + cellPx / 2,
    }));

    const strikePaths = winStrikePaths(pts, theme.winStrike, 31);
    const loopPaths = winLoopPaths(pts, theme.winLoop, 29);

    const all = [
      ...strikePaths.map(p => ({ ...p, isLoop: false })),
      ...loopPaths.map(p => ({ ...p, isLoop: true })),
    ];

    all.forEach((pp, i) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('d', pp.d);
      el.setAttribute('stroke', pp.isLoop ? theme.winLoop : theme.winStrike);
      el.setAttribute('stroke-width', pp.isLoop ? '2.8' : '2.2');
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-linejoin', 'round');
      try {
        const len = el.getTotalLength?.() ?? 500;
        el.style.strokeDasharray = `${len}`;
        el.style.strokeDashoffset = `${len}`;
        el.style.transition = `stroke-dashoffset ${TIMINGS.winDrawMs}ms cubic-bezier(.55,.2,.3,1) ${(pp.isLoop ? 200 : 0) + i * 40}ms`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.strokeDashoffset = '0';
        }));
      } catch { /* no-op */ }
      g.appendChild(el);
    });
  }, [win, theme, cellPx, pad]);

  return <g ref={gRef} />;
}
