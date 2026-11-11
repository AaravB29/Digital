import { useId, useState } from 'react';
import type { Category, Expense, FixedExpenseTemplate } from '../db/types';
import type { ExpenseInput } from '../db/actions';
import { filterAndSortExpenses, type ExpenseSort } from '../lib/categories';
import type { MoneyFormat } from '../lib/money';
import ExpenseList from './ExpenseList';
import { inputClass } from './fieldStyles';

interface Props {
  expenses: Expense[];
  categories: Category[];
  templates: FixedExpenseTemplate[];
  moneyFormat: MoneyFormat;
  onUpdate: (id: string, input: ExpenseInput) => Promise<void>;
  onDelete: (expense: Expense) => void;
}

export default function AllExpensesView({ expenses, categories, ...rest }: Props) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ExpenseSort>('date');
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const shown = filterAndSortExpenses(expenses, query, sort, names);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <label htmlFor={`${id}-q`} className="sr-only">Search expenses</label>
        <input
          id={`${id}-q`}
          type="search"
          className={`${inputClass} min-w-0 flex-1`}
          placeholder="Search notes or categories"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label htmlFor={`${id}-sort`} className="sr-only">Sort by</label>
        <select id={`${id}-sort`} className={`${inputClass} w-auto`} value={sort} onChange={(e) => setSort(e.target.value as ExpenseSort)}>
          <option value="date">Newest first</option>
          <option value="amount">Largest first</option>
        </select>
      </div>
      <ExpenseList
        expenses={shown}
        categories={categories}
        {...rest}
        empty={query ? <>Nothing matches “{query.trim()}”.</> : 'No expenses this month yet. Add one with the form or the + button.'}
      />
    </div>
  );
}
