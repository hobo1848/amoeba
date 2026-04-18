import { useLayoutEffect, useRef } from 'react';
import rough from 'roughjs';

interface Props {
  label: string;
  onClick: () => void;
  color: string;
  w?: number;
  h?: number;
}

export function RoughButton({ label, onClick, color, w = 130, h = 40 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.innerHTML = '';
    const rc = rough.svg(svg);
    svg.appendChild(rc.rectangle(3, 3, w - 6, h - 6, {
      stroke: color, strokeWidth: 1.4, roughness: 1.8, bowing: 1.5, seed: 17,
    }));
  }, [color, w, h]);

  return (
    <button
      className="pbtn"
      onClick={onClick}
      style={{ width: w, height: h, color }}
    >
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} />
      <span>{label}</span>
    </button>
  );
}
