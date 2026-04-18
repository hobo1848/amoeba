import type { Aesthetic } from '../tokens';

interface Props {
  theme: Aesthetic;
  showTexture: boolean;
}

export function PaperDefs({ theme, showTexture }: Props) {
  return (
    <defs>
      <filter id="paperNoise" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="2" seed="4" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <pattern id="fiber" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
        <rect width="200" height="200" fill={theme.paper} />
        {showTexture && (
          <g opacity="0.5">
            <rect width="200" height="200" fill={theme.paper} filter="url(#paperNoise)" />
          </g>
        )}
      </pattern>
    </defs>
  );
}
