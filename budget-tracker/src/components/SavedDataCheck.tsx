import { useEffect, useState } from 'react';
import { db } from '../db/dexie';
import type { Category, FixedExpenseTemplate, Settings } from '../db/types';
import { SETTINGS_ID } from '../db/types';
import { formatMoney } from '../lib/money';
import { formatMonthLabel } from '../lib/months';

const KIND_ORDER: FixedExpenseTemplate['kind'][] = ['rent', 'health_insurance', 'subscription', 'other_fixed'];

interface Snapshot {
  categories: Category[];
  templates: FixedExpenseTemplate[];
  settings?: Settings;
}

/** Read-only view of what is stored in IndexedDB, so the seed can be checked without DevTools. */
export default function SavedDataCheck() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      db.categories.orderBy('sortOrder').toArray(),
      db.fixedTemplates
        .toArray()
        .then((ts) => ts.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))),
      db.settings.get(SETTINGS_ID),
    ])
      .then(([categories, templates, settings]) => setData({ categories, templates, settings }))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <p className="text-red-700">Could not open the database: {error}</p>;
  if (!data) return <p className="text-slate-500">Loading saved data…</p>;

  const format = data.settings ?? { currency: 'EUR', locale: 'de-DE' };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="font-medium">Categories ({data.categories.length})</h3>
        <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {data.categories.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
              <span aria-hidden>{c.icon}</span>
              <span className="flex-1">{c.name}</span>
              {c.isFixed && <span className="text-xs text-slate-500">fixed group</span>}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-medium">Fixed expenses ({data.templates.length})</h3>
        <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {data.templates.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="flex-1">{t.name}</span>
              <span className="text-xs text-slate-500">from {formatMonthLabel(t.activeFrom)}</span>
              <span className="tabular-nums">{formatMoney(t.defaultAmount, format)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-500">
          Currency: {format.currency} · Number format: {format.locale}
        </p>
      </div>
    </div>
  );
}
