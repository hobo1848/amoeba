import type { VulnerablePair } from '../game/pente';
import type { Aesthetic } from '../tokens';

interface Props {
  vulnPairs: VulnerablePair[];
  threatCellsX: { row: number; col: number }[];
  threatCellsO: { row: number; col: number }[];
  cellPx: number;
  pad: number;
  theme: Aesthetic;
  show: boolean;
}

export function CaptureOverlay({
  vulnPairs, threatCellsX, threatCellsO,
  cellPx, pad, theme, show,
}: Props) {
  if (!show) return null;

  const cx = (col: number) => pad + col * cellPx + cellPx / 2;
  const cy = (row: number) => pad + row * cellPx + cellPx / 2;

  const half = cellPx / 2;
  const r = 5;

  return (
    <g pointerEvents="none">
      {/* Dashed brackets around vulnerable pairs */}
      {vulnPairs.map((vp, i) => {
        const color = vp.player === 'X' ? theme.x : theme.o;
        const r0 = vp.cells[0].row, c0 = vp.cells[0].col;
        const r1 = vp.cells[1].row, c1 = vp.cells[1].col;
        const x1 = Math.min(cx(c0), cx(c1)) - half;
        const y1 = Math.min(cy(r0), cy(r1)) - half;
        const x2 = Math.max(cx(c0), cx(c1)) + half;
        const y2 = Math.max(cy(r0), cy(r1)) + half;
        return (
          <rect
            key={`vp-${i}`}
            x={x1} y={y1}
            width={x2 - x1} height={y2 - y1}
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeDasharray="4 3"
            strokeLinecap="round"
            rx={r}
            opacity={0.38}
          />
        );
      })}

      {/* Faint chevron arrows at capture-threat cells for X */}
      {threatCellsX.map(({ row, col }, i) => {
        const x = cx(col), y = cy(row);
        const s = cellPx * 0.2;
        return (
          <path
            key={`tx-${i}`}
            d={`M${x - s},${y + s} L${x},${y - s} L${x + s},${y + s}`}
            fill="none"
            stroke={theme.x}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.3}
          />
        );
      })}

      {/* Faint chevron arrows at capture-threat cells for O */}
      {threatCellsO.map(({ row, col }, i) => {
        const x = cx(col), y = cy(row);
        const s = cellPx * 0.2;
        return (
          <path
            key={`to-${i}`}
            d={`M${x - s},${y + s} L${x},${y - s} L${x + s},${y + s}`}
            fill="none"
            stroke={theme.o}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.3}
          />
        );
      })}
    </g>
  );
}
