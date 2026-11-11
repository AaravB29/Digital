import { useEffect, useState } from 'react';
import type { Category, MonthKey } from '../db/types';
import type { ExpenseInput } from '../db/actions';
import ExpenseForm from './ExpenseForm';

interface Props {
  month: MonthKey;
  categories: Category[];
  locale: string;
  defaultCategoryId?: string;
  /** Changing this resets the form, e.g. when another tab is opened. */
  resetKey?: string;
  onAdd: (input: ExpenseInput) => Promise<void>;
}

/** Always-visible card on desktop; a floating "+" that opens a bottom sheet on mobile. */
export default function QuickAdd({ month, categories, locale, defaultCategoryId, resetKey, onAdd }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const form = (autoFocus: boolean, afterAdd?: () => void) => (
    <ExpenseForm
      key={`${month}:${resetKey ?? ''}:${defaultCategoryId ?? ''}`}
      month={month}
      categories={categories}
      locale={locale}
      defaultCategoryId={defaultCategoryId}
      autoFocus={autoFocus}
      onSubmit={async (input) => {
        await onAdd(input);
        afterAdd?.();
      }}
    />
  );

  return (
    <>
      <div className="hidden rounded-xl border border-slate-200 bg-white p-4 md:block">
        <h2 className="mb-3 font-semibold">Add expense</h2>
        {form(false)}
      </div>

      <button
        type="button"
        aria-label="Add expense"
        className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-3xl text-white shadow-lg hover:bg-teal-800 md:hidden"
        onClick={() => setSheetOpen(true)}
      >
        +
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/50 md:hidden" onClick={() => setSheetOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add expense"
            className="w-full rounded-t-2xl bg-white p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Add expense</h2>
              <button type="button" aria-label="Close" className="rounded p-2 hover:bg-slate-100" onClick={() => setSheetOpen(false)}>
                ✕
              </button>
            </div>
            {form(true, () => setSheetOpen(false))}
          </div>
        </div>
      )}
    </>
  );
}
