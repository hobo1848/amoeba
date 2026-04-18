import type { WinResult } from '../game/checkWin';
import type { Aesthetic } from '../tokens';

interface Props {
  win: WinResult | null;
  theme: Aesthetic;
}

export function WinBanner({ win, theme }: Props) {
  if (!win) return null;
  return (
    <div className="banner show" style={{ color: theme.ui }}>
      {win.player === 'X' ? 'Nyertél! (X)' : 'Gép nyert! (O)'}
    </div>
  );
}
