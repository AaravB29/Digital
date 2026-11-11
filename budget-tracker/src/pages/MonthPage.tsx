import { Navigate, useSearchParams } from 'react-router-dom';
import { addExpense, addIncome, deleteExpense, deleteIncome, restoreExpense, restoreIncome, updateExpense } from '../db/actions';
import type { Expense, Income } from '../db/types';
import { useMonth } from '../hooks/useMonth';
import { useMoneyFormat, useMonthData } from '../hooks/useExpenses';
import { useUndoToast } from '../hooks/useUndoToast';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { selectableCategories, tabCategories } from '../lib/categories';
import { currentMonthKey } from '../lib/months';
import { monthSummary, totalsByCategory } from '../lib/stats';
import AllExpensesView from '../components/AllExpensesView';
import CategoryTabs, { ALL_TAB } from '../components/CategoryTabs';
import CategoryView from '../components/CategoryView';
import IncomePanel from '../components/IncomePanel';
import MonthHeader from '../components/MonthHeader';
import QuickAdd from '../components/QuickAdd';
import SummaryBar from '../components/SummaryBar';
import UndoToast from '../components/UndoToast';

export default function MonthPage() {
  const { month, isValid, goTo } = useMonth();
  const [params, setParams] = useSearchParams();
  const { expenses, incomes, categories, loading } = useMonthData(isValid ? month : currentMonthKey());
  const moneyFormat = useMoneyFormat();
  const { toast, show, dismiss } = useUndoToast();
  const templates = useFixedExpenses(isValid ? month : null);

  if (!isValid) return <Navigate to={`/month/${currentMonthKey()}`} replace />;

  const summary = monthSummary(expenses, incomes);
  const totals = totalsByCategory(expenses);
  const tabs = tabCategories(categories, totals);
  const requested = params.get('tab') ?? ALL_TAB;
  const activeCategory = tabs.find((c) => c.id === requested);
  const activeTab = activeCategory ? activeCategory.id : ALL_TAB;
  const selectable = selectableCategories(categories);
  const defaultCategoryId =
    activeCategory && !activeCategory.archived ? activeCategory.id : selectable.find((c) => !c.isFixed)?.id;

  async function handleDeleteExpense(expense: Expense) {
    const removed = await deleteExpense(expense);
    show(`Deleted ${removed.note || 'expense'}`, () => void restoreExpense(removed));
  }

  async function handleDeleteIncome(income: Income) {
    const removed = await deleteIncome(income);
    show(`Deleted income "${removed.source}"`, () => void restoreIncome(removed));
  }

  const listProps = { categories, templates, moneyFormat, onUpdate: updateExpense, onDelete: handleDeleteExpense };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <MonthHeader month={month} onChange={goTo} />
      <SummaryBar summary={summary} format={moneyFormat} />
      <CategoryTabs
        categories={tabs}
        totals={totals}
        monthTotal={summary.spent}
        active={activeTab}
        moneyFormat={moneyFormat}
        onSelect={(tab) => setParams(tab === ALL_TAB ? {} : { tab }, { replace: true })}
      />
      <div className="grid gap-5 md:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <QuickAdd
            month={month}
            categories={selectable}
            locale={moneyFormat.locale}
            defaultCategoryId={defaultCategoryId}
            resetKey={activeTab}
            onAdd={async (input) => void (await addExpense(input))}
          />
          <div role="tabpanel" aria-label={activeCategory?.name ?? 'All expenses'}>
            {loading ? (
              <p className="text-slate-500">Loading…</p>
            ) : activeCategory ? (
              <CategoryView category={activeCategory} expenses={expenses.filter((e) => e.categoryId === activeCategory.id)} total={totals.get(activeCategory.id) ?? 0} {...listProps} />
            ) : (
              <AllExpensesView expenses={expenses} {...listProps} />
            )}
          </div>
        </div>
        <IncomePanel
          incomes={incomes}
          moneyFormat={moneyFormat}
          onAdd={async (source, amount) => void (await addIncome(month, source, amount))}
          onDelete={handleDeleteIncome}
        />
      </div>
      <UndoToast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
