import type { TerritoryResult } from '../game/moyoLogic';
import type { Aesthetic } from '../tokens';

interface Props {
  territory: TerritoryResult;
  boardSize: number;
  cellPx: number;
  pad: number;
  boardOffsetX: number;
  boardOffsetY: number;
  theme: Aesthetic;
  show: boolean;
}

export function TerritoryOverlay({
  territory, boardSize: _boardSize, cellPx, pad, boardOffsetX, boardOffsetY, theme, show,
}: Props) {
  if (!show) return null;

  const rects: React.ReactElement[] = [];
  const n = territory.cells.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const owner = territory.cells[r][c];
      if (owner !== 'X' && owner !== 'O') continue;
      const fill = owner === 'X' ? theme.x : theme.o;
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={pad + boardOffsetX + c * cellPx + 2}
          y={pad + boardOffsetY + r * cellPx + 2}
          width={cellPx - 4}
          height={cellPx - 4}
          fill={fill}
          opacity={0.13}
          rx={3}
          style={{ animation: 'territoryFadeIn 0.6s ease forwards' }}
        />,
      );
    }
  }

  return <g pointerEvents="none">{rects}</g>;
}
