import { budgetStatus } from '../lib/categories';

const COLORS = { ok: 'bg-emerald-500', warn: 'bg-amber-500', over: 'bg-red-600' } as const;

interface Props {
  spent: number;
  budget?: number;
  className?: string;
}

/** Thin progress bar: green below 80 %, amber up to 100 %, red over budget. */
export default function BudgetBar({ spent, budget, className = '' }: Props) {
  const status = budgetStatus(spent, budget);
  if (!status) return null;
  return (
    <div
      role="meter"
      aria-label="Budget used"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(status.percent, 100)}
      aria-valuetext={`${status.percent} % of budget`}
      className={`h-1 overflow-hidden rounded-full bg-slate-200 ${className}`}
    >
      <div className={`h-full ${COLORS[status.level]}`} style={{ width: `${Math.min(status.percent, 100)}%` }} />
    </div>
  );
}
