import { Navigate } from 'react-router-dom';
import { addExpense, addIncome, deleteExpense, deleteIncome, restoreExpense, restoreIncome, updateExpense } from '../db/actions';
import type { Expense, Income } from '../db/types';
import { useMonth } from '../hooks/useMonth';
import { useMoneyFormat, useMonthData } from '../hooks/useExpenses';
import { useUndoToast } from '../hooks/useUndoToast';
import { currentMonthKey } from '../lib/months';
import { monthSummary } from '../lib/stats';
import ExpenseList from '../components/ExpenseList';
import IncomePanel from '../components/IncomePanel';
import MonthHeader from '../components/MonthHeader';
import QuickAdd from '../components/QuickAdd';
import SummaryBar from '../components/SummaryBar';
import UndoToast from '../components/UndoToast';

export default function MonthPage() {
  const { month, isValid, goTo } = useMonth();
  const { expenses, incomes, categories, loading } = useMonthData(isValid ? month : currentMonthKey());
  const moneyFormat = useMoneyFormat();
  const { toast, show, dismiss } = useUndoToast();

  if (!isValid) return <Navigate to={`/month/${currentMonthKey()}`} replace />;

  const activeCategories = categories.filter((c) => !c.archived);
  const defaultCategoryId = activeCategories.find((c) => !c.isFixed)?.id;

  async function handleDeleteExpense(expense: Expense) {
    const removed = await deleteExpense(expense);
    show(`Deleted ${removed.note || 'expense'}`, () => void restoreExpense(removed));
  }

  async function handleDeleteIncome(income: Income) {
    const removed = await deleteIncome(income);
    show(`Deleted income "${removed.source}"`, () => void restoreIncome(removed));
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <MonthHeader month={month} onChange={goTo} />
      <SummaryBar summary={monthSummary(expenses, incomes)} format={moneyFormat} />
      <div className="grid gap-5 md:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <QuickAdd
            month={month}
            categories={activeCategories}
            locale={moneyFormat.locale}
            defaultCategoryId={defaultCategoryId}
            onAdd={async (input) => void (await addExpense(input))}
          />
          <section aria-label="Expenses">
            <h2 className="mb-2 font-semibold">Expenses</h2>
            {loading ? (
              <p className="text-slate-500">Loading…</p>
            ) : (
              <ExpenseList
                expenses={expenses}
                categories={categories}
                moneyFormat={moneyFormat}
                onUpdate={updateExpense}
                onDelete={handleDeleteExpense}
              />
            )}
          </section>
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
