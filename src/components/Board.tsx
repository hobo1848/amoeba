import { useRef, useState, useLayoutEffect } from 'react';
import type { Aesthetic } from '../tokens';
import { BOARD } from '../tokens';
import type { GameState } from '../game/useGame';
import type { Player } from '../game/checkWin';
import { PaperDefs } from './PaperDefs';
import { Grid } from './Grid';
import { Mark } from './Mark';
import { WinDecoration } from './WinDecoration';
import { PatternOutlines } from './PatternOutlines';
import type { DetectedShape } from '../game/patterns';
import type { BlockedThreatAnim, OutlineVariant } from '../game/usePatternStats';

interface Props {
  theme: Aesthetic;
  gridSize: number;
  /** When set, the SVG viewport matches a `frameGridSize×frameGridSize` grid
   *  and the actual `gridSize` board is centered within it as whitespace. */
  frameGridSize?: number;
  roughness01: number;
  showTexture: boolean;
  showCoords: boolean;
  state: GameState;
  hovered: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  onHover: (pos: { row: number; col: number } | null) => void;
  activeShapes?: DetectedShape[];
  forkShapeKeys?: Set<string>;
  blockedAnim?: BlockedThreatAnim | null;
  showPatterns?: boolean;
  outlineVariant?: OutlineVariant;
  /** Extra SVG content rendered above marks (e.g. territory overlay). Receives computed pad so overlays can align correctly on mobile. */
  overlayContent?: (pad: number) => React.ReactNode;
}

export function Board({
  theme, gridSize, frameGridSize, roughness01, showTexture, showCoords,
  state, hovered, onCellClick, onHover,
  activeShapes = [], forkShapeKeys = new Set(), blockedAnim = null,
  showPatterns = true, outlineVariant = 'A',
  overlayContent,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  // When frameGridSize is set, cell size is based on the outer frame so the
  // actual board is centered in the same viewport as a `frameGridSize` grid.
  const effectiveFrame = frameGridSize ?? gridSize;
  const cellPx = BOARD.cellPx(effectiveFrame);

  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const pad = isMobile ? 14 : BOARD.pad;
  const boardPx = cellPx * gridSize;
  const framePx = cellPx * effectiveFrame;
  // Offset to center the inner grid inside the outer frame (same for X and Y).
  const boardOffset = Math.floor((framePx - boardPx) / 2);
  const coordsSpace = showCoords ? 22 : 0;
  const viewW = framePx + pad * 2 + coordsSpace;
  const viewH = framePx + pad * 2 + coordsSpace;

  // Unified SVG → grid-cell conversion used by all pointer handlers.
  const svgToCell = (clientX: number, clientY: number): { row: number; col: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const x = local.x - pad - boardOffset;
    const y = local.y - pad - boardOffset;
    if (x < 0 || y < 0 || x >= boardPx || y >= boardPx) return null;
    const col = Math.floor(x / cellPx);
    const row = Math.floor(y / cellPx);
    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) return null;
    return { row, col };
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const pos = svgToCell(e.clientX, e.clientY);
    if (pos) onCellClick(pos.row, pos.col);
  };

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    onHover(svgToCell(e.clientX, e.clientY));
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    onHover(svgToCell(e.touches[0].clientX, e.touches[0].clientY));
  };

  const hoverX = hovered ? pad + boardOffset + hovered.col * cellPx + cellPx / 2 : 0;
  const hoverY = hovered ? pad + boardOffset + hovered.row * cellPx + cellPx / 2 : 0;
  const canPlace = hovered &&
    hovered.row < state.board.length &&
    !state.board[hovered.row][hovered.col] &&
    !state.win &&
    state.turn === 'X';

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
            <text key={`cx${i}`} x={pad + boardOffset + i * cellPx + cellPx / 2} y={pad + boardOffset - 10} textAnchor="middle">
              {String.fromCharCode(65 + i)}
            </text>
          ))}
          {Array.from({ length: gridSize }).map((_, i) => (
            <text key={`cy${i}`} x={pad + boardOffset - 10} y={pad + boardOffset + i * cellPx + cellPx / 2 + 3} textAnchor="middle">
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
        offsetX={boardOffset}
        offsetY={boardOffset}
        svgEl={svgRef.current}
      />

      {overlayContent?.(pad)}

      {canPlace && (
        <g opacity="0.28" pointerEvents="none">
          <HoverGhost turn={state.turn} hoverX={hoverX} hoverY={hoverY} cellPx={cellPx} theme={theme} />
        </g>
      )}

      {state.board.flatMap((boardRow, row) =>
        boardRow.map((cell, col) => {
          const player = cell as Player | null;
          if (!player) return null;
          const cx = pad + boardOffset + col * cellPx + cellPx / 2;
          const cy = pad + boardOffset + row * cellPx + cellPx / 2;
          const isNew = !!(state.lastMove && state.lastMove.row === row && state.lastMove.col === col);
          return (
            <Mark
              key={`${row}-${col}`}
              kind={player}
              cx={cx}
              cy={cy}
              size={cellPx * 0.88}
              theme={theme}
              roughness01={roughness01}
              row={row}
              col={col}
              animate={isNew}
            />
          );
        })
      )}

      {showPatterns && (
        <PatternOutlines
          shapes={activeShapes}
          forkShapeKeys={forkShapeKeys}
          blockedAnim={blockedAnim}
          cellPx={cellPx}
          pad={pad}
          offsetX={boardOffset}
          offsetY={boardOffset}
          theme={theme}
          variant={outlineVariant}
        />
      )}

      {state.win && (
        <WinDecoration win={state.win} theme={theme} cellPx={cellPx} pad={pad} offsetX={boardOffset} offsetY={boardOffset} />
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
