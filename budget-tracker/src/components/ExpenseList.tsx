import type { ReactNode } from 'react';
import type { Category, Expense, FixedExpenseTemplate } from '../db/types';
import type { ExpenseInput } from '../db/actions';
import { editFixedAmount, resetFixedAmount, setFixedPaid } from '../db/fixedActions';
import type { MoneyFormat } from '../lib/money';
import ExpenseRow from './ExpenseRow';
import FixedExpenseRow from './FixedExpenseRow';

interface Props {
  expenses: Expense[];
  categories: Category[];
  templates: FixedExpenseTemplate[];
  moneyFormat: MoneyFormat;
  onUpdate: (id: string, input: ExpenseInput) => Promise<void>;
  onDelete: (expense: Expense) => void;
  empty: ReactNode;
}

/** Renders normal rows and generated fixed rows (with their paid tick) in one list. */
export default function ExpenseList({ expenses, categories, templates, moneyFormat, onUpdate, onDelete, empty }: Props) {
  if (expenses.length === 0) {
    return <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">{empty}</div>;
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const templateById = new Map(templates.map((t) => [t.id, t]));
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {expenses.map((e) =>
        e.templateId ? (
          <FixedExpenseRow
            key={e.id}
            row={e}
            template={templateById.get(e.templateId)}
            moneyFormat={moneyFormat}
            onTogglePaid={(row, paid) => void setFixedPaid(row.id, paid)}
            onEditAmount={editFixedAmount}
            onReset={(row) => void resetFixedAmount(row)}
          />
        ) : (
          <ExpenseRow
            key={e.id}
            expense={e}
            category={categoryById.get(e.categoryId)}
            categories={categories}
            moneyFormat={moneyFormat}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ),
      )}
    </ul>
  );
}
