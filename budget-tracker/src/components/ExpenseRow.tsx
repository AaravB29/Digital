import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { Category, Expense } from '../db/types';
import type { ExpenseInput } from '../db/actions';
import { formatMoney, type MoneyFormat } from '../lib/money';
import ExpenseForm from './ExpenseForm';

interface Props {
  expense: Expense;
  category?: Category;
  categories: Category[];
  moneyFormat: MoneyFormat;
  onUpdate: (id: string, input: ExpenseInput) => Promise<void>;
  onDelete: (expense: Expense) => void;
}

const iconButton = 'rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600';

export default function ExpenseRow({ expense, category, categories, moneyFormat, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="bg-teal-50/60 px-4 py-4">
        <ExpenseForm
          month={expense.month}
          categories={categories}
          locale={moneyFormat.locale}
          initial={expense}
          autoFocus
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            await onUpdate(expense.id, input);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="w-14 shrink-0 whitespace-nowrap text-sm tabular-nums text-slate-500">{format(parseISO(expense.date), 'd MMM')}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate">{expense.note || category?.name || 'Expense'}</p>
        {category && (
          <p className="truncate text-xs text-slate-500">
            {category.icon} {category.name}
          </p>
        )}
      </div>
      <span className="font-medium tabular-nums">{formatMoney(expense.amount, moneyFormat)}</span>
      <div className="flex shrink-0">
        <button type="button" aria-label={`Edit ${expense.note || 'expense'}`} className={iconButton} onClick={() => setEditing(true)}>
          ✏️
        </button>
        <button type="button" aria-label={`Delete ${expense.note || 'expense'}`} className={iconButton} onClick={() => onDelete(expense)}>
          🗑️
        </button>
      </div>
    </li>
  );
}
