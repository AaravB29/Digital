import type { MoneyFormat } from '../../lib/money';
import { formatMoney } from '../../lib/money';

interface Entry {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  payload?: { fill?: string };
}

interface Props {
  active?: boolean;
  label?: string | number;
  payload?: Entry[];
  moneyFormat: MoneyFormat;
  /** Optional line under the values, e.g. a total. */
  footer?: (entries: Entry[]) => string | null;
}

/** Shared hover card: label, then one row per series with its colour and value. */
export default function ChartTooltip({ active, label, payload, moneyFormat, footer }: Props) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => typeof p.value === 'number');
  const extra = footer?.(rows);
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      {label !== undefined && <p className="mb-1 font-medium">{label}</p>}
      {rows.map((p) => (
        <p key={String(p.name)} className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color ?? p.payload?.fill }} />
          <span className="flex-1 text-slate-600">{p.name}</span>
          <span className="tabular-nums">{formatMoney(p.value as number, moneyFormat)}</span>
        </p>
      ))}
      {extra && <p className="mt-1 border-t border-slate-100 pt-1 text-slate-600">{extra}</p>}
    </div>
  );
}
