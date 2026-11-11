import type { Category, Expense, FixedExpenseTemplate } from '../db/types';
import type { ExpenseInput } from '../db/actions';
import { budgetStatus } from '../lib/categories';
import { splitFixedRows } from '../lib/fixed';
import { formatMoney, type MoneyFormat } from '../lib/money';
import BudgetBar from './BudgetBar';
import ExpenseList from './ExpenseList';
import FixedExpenseSection from './FixedExpenseSection';

interface Props {
  category: Category;
  expenses: Expense[];
  total: number;
  categories: Category[];
  templates: FixedExpenseTemplate[];
  moneyFormat: MoneyFormat;
  onUpdate: (id: string, input: ExpenseInput) => Promise<void>;
  onDelete: (expense: Expense) => void;
}

const LEVEL_TEXT = { ok: 'text-emerald-700', warn: 'text-amber-700', over: 'text-red-700' } as const;

/** One category tab: its subtotal, budget and rows. The Fixed tab also shows paid / still due. */
export default function CategoryView({ category, expenses, total, ...rest }: Props) {
  const status = budgetStatus(total, category.monthlyBudget);
  const { fixed, variable } = splitFixedRows(expenses);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-slate-600">
          {category.icon} {category.name}: <span className="font-semibold tabular-nums text-slate-900">{formatMoney(total, rest.moneyFormat)}</span>
          {status && category.monthlyBudget && (
            <>
              {' '}of {formatMoney(category.monthlyBudget, rest.moneyFormat)} budget ·{' '}
              <span className={`font-medium ${LEVEL_TEXT[status.level]}`}>
                {status.level === 'over'
                  ? `${formatMoney(total - category.monthlyBudget, rest.moneyFormat)} over`
                  : `${formatMoney(category.monthlyBudget - total, rest.moneyFormat)} left`}
              </span>
            </>
          )}
        </p>
        <BudgetBar spent={total} budget={category.monthlyBudget} className="mt-2 h-1.5" />
      </div>
      {category.isFixed && <FixedExpenseSection rows={fixed} templates={rest.templates} moneyFormat={rest.moneyFormat} />}
      {(!category.isFixed || variable.length > 0) && (
        <section aria-label={`${category.name} expenses`}>
          {category.isFixed && <h2 className="mb-2 font-semibold">Other fixed costs</h2>}
          <ExpenseList expenses={variable} {...rest} empty={`No ${category.name} expenses this month.`} />
        </section>
      )}
    </div>
  );
}
