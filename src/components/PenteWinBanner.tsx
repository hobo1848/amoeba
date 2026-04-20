import type { PenteWin } from '../game/pente';
import type { Aesthetic } from '../tokens';

interface Props {
  win: PenteWin | null;
  theme: Aesthetic;
}

export function PenteWinBanner({ win, theme }: Props) {
  if (!win) return null;
  const who = win.player === 'X' ? 'You won!' : 'CPU won!';
  const how = win.type === 'captures' ? '(5 pairs captured)' : '(5-in-a-row)';
  return (
    <div className="banner show" style={{ color: theme.ui }}>
      {who} {how}
    </div>
  );
}
