import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { Category } from '../db/types';
import { formatMoney, type MoneyFormat } from '../lib/money';
import BudgetBar from './BudgetBar';

export const ALL_TAB = 'all';

interface Props {
  categories: Category[];
  totals: Map<string, number>;
  monthTotal: number;
  active: string;
  moneyFormat: MoneyFormat;
  onSelect: (tab: string) => void;
}

export default function CategoryTabs({ categories, totals, monthTotal, active, moneyFormat, onSelect }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the selected tab visible in the scrolling bar (matters on phones).
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (el && listRef.current) {
      const list = listRef.current;
      if (el.offsetLeft < list.scrollLeft || el.offsetLeft + el.offsetWidth > list.scrollLeft + list.clientWidth) {
        list.scrollTo({ left: el.offsetLeft - 16, behavior: 'smooth' });
      }
    }
  }, [active]);
  const tabs = [
    { id: ALL_TAB, label: 'All', icon: '', total: monthTotal, budget: undefined, archived: false },
    ...categories.map((c) => ({ id: c.id, label: c.name, icon: c.icon ?? '', total: totals.get(c.id) ?? 0, budget: c.monthlyBudget, archived: c.archived })),
  ];

  // Left/right arrow keys move between tabs.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    onSelect(next.id);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus();
  }

  return (
    <div ref={listRef} role="tablist" aria-label="Categories" onKeyDown={onKeyDown} className="relative -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            data-tab={t.id}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(t.id)}
            className={`flex min-w-24 shrink-0 flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-teal-600 ${
              selected ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'
            } ${t.archived ? 'opacity-70' : ''}`}
          >
            <span className={`whitespace-nowrap text-sm ${selected ? 'font-semibold text-teal-900' : 'text-slate-700'}`}>
              {t.icon && <span aria-hidden>{t.icon} </span>}
              {t.label}
              {t.archived && <span className="text-xs font-normal text-slate-500"> (archived)</span>}
            </span>
            <span className="text-xs tabular-nums text-slate-500">{formatMoney(t.total, moneyFormat)}</span>
            <BudgetBar spent={t.total} budget={t.budget} className="mt-1 w-full" />
          </button>
        );
      })}
    </div>
  );
}
