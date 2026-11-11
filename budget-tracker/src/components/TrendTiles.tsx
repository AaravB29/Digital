import type { Category } from '../db/types';
import { formatMoney, type MoneyFormat } from '../lib/money';
import { formatMonthLabel } from '../lib/months';
import StatTile from './StatTile';

interface Props {
  tiles: {
    average: number;
    highest: { month: string; spent: number } | null;
    biggest: { category?: Category; total: number; percent: number } | null;
    savings: number | null;
  };
  moneyFormat: MoneyFormat;
}

export default function TrendTiles({ tiles, moneyFormat }: Props) {
  const money = (c: number) => formatMoney(c, moneyFormat);
  const pct = (n: number) => `${n.toLocaleString(moneyFormat.locale)} %`;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile label="Average per month" value={money(tiles.average)} detail="months with spending" />
      <StatTile label="Highest month" value={tiles.highest ? money(tiles.highest.spent) : '–'} detail={tiles.highest ? formatMonthLabel(tiles.highest.month) : 'no spending yet'} />
      <StatTile label="Biggest category" value={tiles.biggest?.category?.name ?? '–'} detail={tiles.biggest ? `${money(tiles.biggest.total)} · ${pct(tiles.biggest.percent)}` : undefined} />
      <StatTile
        label="Savings rate"
        value={tiles.savings === null ? '–' : pct(tiles.savings)}
        detail={tiles.savings === null ? 'add income to see it' : 'of income not spent'}
        tone={tiles.savings === null ? 'default' : tiles.savings < 0 ? 'bad' : 'good'}
      />
    </div>
  );
}
