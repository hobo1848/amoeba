import type { AestheticKey, GridSize, Aesthetic } from '../tokens';
import { AESTHETICS, GRID_SIZES } from '../tokens';

export interface TweakState {
  aesthetic: AestheticKey;
  roughness: number;
  gridSize: GridSize;
  paperTexture: boolean;
  showCoords: boolean;
}

interface Props {
  tweaks: TweakState;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<TweakState>) => void;
  theme: Aesthetic;
}

export function Tweaks({ tweaks, open, onToggle, onChange, theme }: Props) {
  return (
    <>
      <button
        className="tweaks-toggle"
        onClick={onToggle}
        style={{ color: theme.ui, borderColor: theme.grid }}
        aria-label="Toggle tweaks panel"
      >
        Tweaks
      </button>
      <div className={`tweaks${open ? ' show' : ''}`}>
        <h3>Tweaks</h3>

        <div className="tw-row">
          <label className="tw-label">Aesthetic</label>
          <div className="tw-seg">
            {(Object.entries(AESTHETICS) as [AestheticKey, Aesthetic][]).map(([k, v]) => (
              <button
                key={k}
                className={tweaks.aesthetic === k ? 'active' : ''}
                onClick={() => onChange({ aesthetic: k })}
              >
                <span className="sw" style={{ background: v.x }} />
                {k}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
            {AESTHETICS[tweaks.aesthetic].name}
          </div>
        </div>

        <div className="tw-row">
          <label className="tw-label">Grid size</label>
          <div className="tw-seg">
            {GRID_SIZES.map(n => (
              <button
                key={n}
                className={tweaks.gridSize === n ? 'active' : ''}
                onClick={() => onChange({ gridSize: n })}
              >
                {n}×{n}
              </button>
            ))}
          </div>
        </div>

        <div className="tw-row">
          <label className="tw-label">
            Roughness <span className="tw-val">{tweaks.roughness}</span>
          </label>
          <input
            type="range" min="0" max="100" step="5"
            value={tweaks.roughness}
            className="tw-slider"
            onChange={e => onChange({ roughness: parseInt(e.target.value, 10) })}
          />
        </div>

        <div className="tw-row">
          <label className="tw-check">
            <input
              type="checkbox"
              checked={tweaks.paperTexture}
              onChange={e => onChange({ paperTexture: e.target.checked })}
            />
            Paper fibre texture
          </label>
        </div>

        <div className="tw-row">
          <label className="tw-check">
            <input
              type="checkbox"
              checked={tweaks.showCoords}
              onChange={e => onChange({ showCoords: e.target.checked })}
            />
            Show coordinates (A–O, 1–{tweaks.gridSize})
          </label>
        </div>
      </div>
    </>
  );
}
