import type { Aesthetic } from '../tokens';
import type { TerritoryResult } from '../game/moyoLogic';
import { moyoWinner } from '../game/moyoLogic';

interface Props {
  gameOver: boolean;
  territory: TerritoryResult;
  theme: Aesthetic;
}

export function MoyoWinBanner({ gameOver, territory, theme }: Props) {
  if (!gameOver) return null;
  const winner = moyoWinner(territory);
  const x = territory.xTerritory;
  const o = territory.oTerritory;
  let msg: string;
  if (winner === 'X') msg = `You won!  (X ${x} – O ${o})`;
  else if (winner === 'O') msg = `CPU won!  (O ${o} – X ${x})`;
  else msg = `Draw!  (X ${x} – O ${o})`;

  return (
    <div className="banner show" style={{ color: theme.ui }}>
      {msg}
    </div>
  );
}
