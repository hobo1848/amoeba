import { useRef, useState, useLayoutEffect } from 'react';
import type { Aesthetic } from '../tokens';
import { BOARD } from '../tokens';
import type { GameState } from '../game/useGame';
import type { Player } from '../game/checkWin';
import { PaperDefs } from './PaperDefs';
import { Grid } from './Grid';
import { Mark } from './Mark';
import { WinDecoration } from './WinDecoration';

interface Props {
  theme: Aesthetic;
  gridSize: number;
  roughness01: number;
  showTexture: boolean;
  showCoords: boolean;
  state: GameState;
  hovered: { r: number; c: number } | null;
  onCellClick: (r: number, c: number) => void;
  onHover: (pos: { r: number; c: number } | null) => void;
}

export function Board({
  theme, gridSize, roughness01, showTexture, showCoords,
  state, hovered, onCellClick, onHover,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cellPx = BOARD.cellPx(gridSize);

  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  // Use a tighter border on narrow screens so the grid cells are as large as possible
  const pad = isMobile ? 14 : BOARD.pad;
  const boardPx = cellPx * gridSize;
  const coordsSpace = showCoords ? 22 : 0;
  const viewW = boardPx + pad * 2 + coordsSpace;
  const viewH = boardPx + pad * 2 + coordsSpace;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const x = local.x - pad, y = local.y - pad;
    if (x < 0 || y < 0 || x > boardPx || y > boardPx) return;
    const c = Math.floor(x / cellPx), r = Math.floor(y / cellPx);
    if (r >= 0 && c >= 0 && r < gridSize && c < gridSize) onCellClick(r, c);
  };

  const svgCoordsFromTouch = (touch: React.Touch) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = touch.clientX; pt.y = touch.clientY;
    const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const x = local.x - pad, y = local.y - pad;
    if (x < 0 || y < 0 || x > boardPx || y > boardPx) return null;
    const c = Math.floor(x / cellPx), r = Math.floor(y / cellPx);
    if (r < 0 || c < 0 || r >= gridSize || c >= gridSize) return null;
    return { r, c };
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    const pos = svgCoordsFromTouch(e.touches[0]);
    onHover(pos);
  };

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const x = local.x - pad, y = local.y - pad;
    if (x < 0 || y < 0 || x > boardPx || y > boardPx) { onHover(null); return; }
    const c = Math.floor(x / cellPx), r = Math.floor(y / cellPx);
    onHover({ r, c });
  };

  const hoverX = hovered ? pad + hovered.c * cellPx + cellPx / 2 : 0;
  const hoverY = hovered ? pad + hovered.r * cellPx + cellPx / 2 : 0;
  const canPlace = hovered && !state.board[hovered.r][hovered.c] && !state.win && state.turn === 'X';

  return (
    <svg
      ref={svgRef}
      className="board-svg"
      viewBox={`0 0 ${viewW} ${viewH}`}
      onClick={handleClick}
      onMouseMove={handleMove}
      onMouseLeave={() => onHover(null)}
      onTouchStart={handleTouchStart}
      onTouchEnd={() => onHover(null)}
      role="grid"
      aria-label={`${gridSize}×${gridSize} Amőba board`}
    >
      <PaperDefs theme={theme} showTexture={showTexture} />
      <rect x="0" y="0" width={viewW} height={viewH} fill="url(#fiber)" />

      {showCoords && (
        <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill={theme.muted}>
          {Array.from({ length: gridSize }).map((_, i) => (
            <text key={`cx${i}`} x={pad + i * cellPx + cellPx / 2} y={pad - 10} textAnchor="middle">
              {String.fromCharCode(65 + i)}
            </text>
          ))}
          {Array.from({ length: gridSize }).map((_, i) => (
            <text key={`cy${i}`} x={pad - 10} y={pad + i * cellPx + cellPx / 2 + 3} textAnchor="middle">
              {i + 1}
            </text>
          ))}
        </g>
      )}

      <Grid
        theme={theme}
        gridSize={gridSize}
        cellPx={cellPx}
        boardPx={boardPx}
        pad={pad}
        svgEl={svgRef.current}
      />

      {canPlace && (
        <g opacity="0.28" pointerEvents="none">
          <HoverGhost turn={state.turn} hoverX={hoverX} hoverY={hoverY} cellPx={cellPx} theme={theme} />
        </g>
      )}

      {Array.from({ length: gridSize }, (_, r) =>
        Array.from({ length: gridSize }, (_, c) => {
          const p = state.board[r][c] as Player | null;
          if (!p) return null;
          const cx = pad + c * cellPx + cellPx / 2;
          const cy = pad + r * cellPx + cellPx / 2;
          const isNew = !!(state.lastMove && state.lastMove.r === r && state.lastMove.c === c);
          return (
            <Mark
              key={`${r}-${c}`}
              kind={p}
              cx={cx}
              cy={cy}
              size={cellPx * 0.88}
              theme={theme}
              roughness01={roughness01}
              r={r}
              c={c}
              animate={isNew}
            />
          );
        })
      )}

      {state.win && (
        <WinDecoration win={state.win} theme={theme} cellPx={cellPx} pad={pad} />
      )}
    </svg>
  );
}

function HoverGhost({
  turn, hoverX, hoverY, cellPx, theme,
}: { turn: Player; hoverX: number; hoverY: number; cellPx: number; theme: Aesthetic }) {
  const half = cellPx * 0.28;
  if (turn === 'X') {
    return (
      <>
        <line x1={hoverX - half} y1={hoverY - half} x2={hoverX + half} y2={hoverY + half}
          stroke={theme.x} strokeWidth="2" strokeLinecap="round" />
        <line x1={hoverX + half} y1={hoverY - half} x2={hoverX - half} y2={hoverY + half}
          stroke={theme.x} strokeWidth="2" strokeLinecap="round" />
      </>
    );
  }
  return <circle cx={hoverX} cy={hoverY} r={cellPx * 0.3} fill="none" stroke={theme.o} strokeWidth="2" />;
}
