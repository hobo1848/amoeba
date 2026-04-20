import rough from 'roughjs';

const gen = rough.generator();

export const seedFor = (row: number, col: number, salt = 0): number =>
  (((row * 73856093) ^ (col * 19349663) ^ (salt * 83492791)) >>> 0);

function markOpts(color: string, r01: number, seed: number) {
  return {
    stroke: color,
    strokeWidth: 2.1,
    roughness: 0.6 + r01 * 2.4,
    bowing: 1.0 + r01 * 2.0,
    seed,
  };
}

type Drawable = ReturnType<typeof gen.line>;

function extract(drawable: Drawable): { d: string }[] {
  const out: { d: string }[] = [];
  for (const set of drawable.sets) {
    if (set.type !== 'path' && set.type !== 'fillPath') continue;
    let d = '';
    for (const op of set.ops) {
      if (op.op === 'move')     d += `M${op.data[0]} ${op.data[1]} `;
      if (op.op === 'lineTo')   d += `L${op.data[0]} ${op.data[1]} `;
      if (op.op === 'bcurveTo') d += `C${op.data[0]} ${op.data[1]},${op.data[2]} ${op.data[3]},${op.data[4]} ${op.data[5]} `;
    }
    if (d.trim()) out.push({ d: d.trim() });
  }
  return out;
}

export function xPaths(
  cx: number, cy: number, size: number,
  color: string, r01: number, seed: number,
): { d: string }[] {
  const pad = size * 0.22;
  return [
    ...extract(gen.line(cx - size/2 + pad, cy - size/2 + pad, cx + size/2 - pad, cy + size/2 - pad, markOpts(color, r01, seed))),
    ...extract(gen.line(cx + size/2 - pad, cy - size/2 + pad, cx - size/2 + pad, cy + size/2 - pad, markOpts(color, r01, seed + 1))),
  ];
}

export function oPaths(
  cx: number, cy: number, size: number,
  color: string, r01: number, seed: number,
): { d: string }[] {
  const r = size * 0.32;
  return extract(gen.arc(cx, cy, r * 2, r * 2, -0.2 * Math.PI, 2 * Math.PI - 0.1, false, markOpts(color, r01, seed)));
}

export function winLoopPaths(
  points: { x: number; y: number }[],
  color: string,
  seed = 29,
): { d: string }[] {
  const a = points[0], b = points[points.length - 1];
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const e = 22;
  const verts: [number, number][] = [
    [a.x + nx*e - ux*e, a.y + ny*e - uy*e],
    [b.x + nx*e + ux*e, b.y + ny*e + uy*e],
    [b.x - nx*e + ux*e, b.y - ny*e + uy*e],
    [a.x - nx*e - ux*e, a.y - ny*e - uy*e],
    [a.x + nx*e - ux*e, a.y + ny*e - uy*e],
  ];
  return extract(gen.curve(verts, { stroke: color, strokeWidth: 2.6, roughness: 2.0, bowing: 2.5, seed }));
}

export function winStrikePaths(
  points: { x: number; y: number }[],
  color: string,
  seed = 31,
): { d: string }[] {
  const a = points[0], b = points[points.length - 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
  return extract(gen.line(
    a.x - ux * 10, a.y - uy * 10,
    b.x + ux * 10, b.y + uy * 10,
    { stroke: color, strokeWidth: 2.2, roughness: 1.6, bowing: 1.5, seed },
  ));
}

export function patternOvalPaths(
  a: { x: number; y: number },
  b: { x: number; y: number },
  halfWidth: number,
  color: string,
  strokeWidth: number,
  seed: number,
  strokeLineDash?: [number, number],
): { d: string }[] {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  const e = halfWidth;
  const verts: [number, number][] = [
    [a.x + nx * e - ux * e, a.y + ny * e - uy * e],
    [b.x + nx * e + ux * e, b.y + ny * e + uy * e],
    [b.x - nx * e + ux * e, b.y - ny * e + uy * e],
    [a.x - nx * e - ux * e, a.y - ny * e - uy * e],
    [a.x + nx * e - ux * e, a.y + ny * e - uy * e],
  ];
  return extract(gen.curve(verts, {
    stroke: color,
    strokeWidth,
    roughness: 1.0,
    bowing: 1.5,
    seed,
    strokeLineDash,
  }));
}

export function gridRectOpts(color: string) {
  return { stroke: color, strokeWidth: 1.2, roughness: 0.8, bowing: 0.8, seed: 11, fill: 'none' };
}

export function gridLineOpts(color: string, seedVal: number) {
  return { stroke: color, strokeWidth: 0.7, roughness: 0.6, bowing: 0.8, seed: seedVal, strokeLineDash: [2, 3] as [number, number] };
}
