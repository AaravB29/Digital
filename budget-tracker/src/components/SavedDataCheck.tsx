import { useEffect, useState } from 'react';
import { db } from '../db/dexie';
import type { Category, Settings } from '../db/types';
import { SETTINGS_ID } from '../db/types';

interface Snapshot {
  categories: Category[];
  settings?: Settings;
}

/** Read-only view of what is stored in IndexedDB, so the seed can be checked without DevTools. */
export default function SavedDataCheck() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      db.categories.orderBy('sortOrder').toArray(),
      db.settings.get(SETTINGS_ID),
    ])
      .then(([categories, settings]) => setData({ categories, settings }))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <p className="text-red-700">Could not open the database: {error}</p>;
  if (!data) return <p className="text-slate-500">Loading saved data…</p>;

  const format = data.settings ?? { currency: 'EUR', locale: 'de-DE' };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
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
        <p className="text-sm text-slate-500">
          Currency: {format.currency} · Number format: {format.locale}
        </p>
      </div>
    </div>
  );
}
