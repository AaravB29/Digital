import type { Category, Expense } from '../db/types';
import type { ExpenseInput } from '../db/actions';
import type { MoneyFormat } from '../lib/money';
import ExpenseRow from './ExpenseRow';

interface Props {
  expenses: Expense[];
  categories: Category[];
  moneyFormat: MoneyFormat;
  onUpdate: (id: string, input: ExpenseInput) => Promise<void>;
  onDelete: (expense: Expense) => void;
}

export default function ExpenseList({ expenses, categories, moneyFormat, onUpdate, onDelete }: Props) {
  if (expenses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">
        No expenses this month yet. Add one with the form{' '}
        <span className="md:hidden">or the + button</span>.
      </p>
    );
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {expenses.map((e) => (
        <ExpenseRow
          key={e.id}
          expense={e}
          category={byId.get(e.categoryId)}
          categories={categories}
          moneyFormat={moneyFormat}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
