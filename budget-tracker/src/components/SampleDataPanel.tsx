import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { countSampleExpenses, loadSampleData, removeSampleData } from '../db/sampleActions';
import { secondaryButton } from './fieldStyles';

/** Testing helper, shown only in development and preview builds. */
export default function SampleDataPanel() {
  const count = useLiveQuery(countSampleExpenses, []);
  const [busy, setBusy] = useState(false);
  const run = (fn: () => Promise<unknown>) => {
    setBusy(true);
    void fn().finally(() => setBusy(false));
  };

  return (
    <section className="rounded-xl border border-dashed border-slate-300 p-4">
      <h2 className="font-semibold">Testing tools</h2>
      <p className="mt-1 text-sm text-slate-600">
        Adds six months of made-up expenses and income, ending last month, so the charts have something to show. Your
        current month is not touched, and sample entries can be removed in one go.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={secondaryButton} disabled={busy} onClick={() => run(loadSampleData)}>
          Load sample data
        </button>
        {!!count && (
          <button type="button" className={`${secondaryButton} text-red-700`} disabled={busy} onClick={() => run(removeSampleData)}>
            Remove sample data ({count} entries)
          </button>
        )}
      </div>
    </section>
  );
}
