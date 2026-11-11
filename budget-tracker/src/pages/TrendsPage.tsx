import { useState } from 'react';
import { useMoneyFormat } from '../hooks/useExpenses';
import { useTrendsView } from '../hooks/useStats';
import { averageMonthly } from '../lib/stats';
import { formatMonthLabel, presetRange } from '../lib/months';
import BudgetVsActualTable from '../components/BudgetVsActualTable';
import MonthOverMonthTable from '../components/MonthOverMonthTable';
import RangeSelector, { type RangeChoice } from '../components/RangeSelector';
import SampleDataPanel from '../components/SampleDataPanel';
import TrendTiles from '../components/TrendTiles';
import DailyTrendCard from '../components/DailyTrendCard';
import ExportButtons from '../components/ExportButtons';
import { db } from '../db/dexie';
import { expensesToCsv } from '../lib/csv';
import TopExpenses from '../components/TopExpenses';
import { inputBase } from '../components/fieldStyles';
import ChartCard from '../components/charts/ChartCard';
import CategoryDonut from '../components/charts/CategoryDonut';
import CategoryStackChart from '../components/charts/CategoryStackChart';
import CategoryTrendChart from '../components/charts/CategoryTrendChart';
import FixedVariableChart from '../components/charts/FixedVariableChart';
import SpendingIncomeChart from '../components/charts/SpendingIncomeChart';

const SHOW_TEST_TOOLS = import.meta.env.DEV || !!import.meta.env.VITE_PREVIEW;

export default function TrendsPage() {
  const moneyFormat = useMoneyFormat();
  const [choice, setChoice] = useState<RangeChoice>('last6');
  const [custom, setCustom] = useState(() => presetRange('last6'));
  const [from, to] = choice === 'custom' ? custom : presetRange(choice);
  const v = useTrendsView(from, to);
  const [pickedCategory, setPickedCategory] = useState<string | null>(null);
  const [dailyMonth, setDailyMonth] = useState<string | null>(null);
  // Months that only hold €0 fixed placeholders count as empty too.
  const isEmpty = !v.loading && v.series.every((p) => p.spent === 0);

  const trendId = pickedCategory && v.byId.has(pickedCategory) ? pickedCategory : v.rankedCategoryIds[0] ?? v.categories[0]?.id;
  const trendCategory = trendId ? v.byId.get(trendId) : undefined;
  const trendValues = (trendId && v.matrix.get(trendId)) || v.months.map(() => 0);
  const rangeLabel = from === to ? formatMonthLabel(from) : `${formatMonthLabel(from)} – ${formatMonthLabel(to)}`;
  const endLabel = formatMonthLabel(to);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Trends</h1>
        <p className="text-sm text-slate-500">{rangeLabel}</p>
      </div>
      <RangeSelector
        choice={choice}
        from={from}
        to={to}
        onChoice={(c) => {
          if (c === 'custom') setCustom([from, to]);
          setChoice(c);
        }}
        onCustom={(f, t) => setCustom([f, t])}
      />

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">
          No spending in {rangeLabel} yet. Add some on the Month page{SHOW_TEST_TOOLS ? ', or load sample data below' : ''}, and charts will appear here.
        </div>
      ) : (
      <>
      <TrendTiles tiles={v.tiles} moneyFormat={moneyFormat} />

      <ChartCard title="Spending and income per month">
        <SpendingIncomeChart series={v.series} moneyFormat={moneyFormat} />
      </ChartCard>

      <DailyTrendCard month={dailyMonth ?? to} onMonthChange={setDailyMonth} categories={v.categories} moneyFormat={moneyFormat} />

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Spending by category" subtitle="Smaller categories are grouped as Other">
          <CategoryStackChart months={v.months} series={v.stackSeries} moneyFormat={moneyFormat} />
        </ChartCard>
        <ChartCard title={`${endLabel} by category`}>
          <CategoryDonut slices={v.donutSlices} total={v.endTotal} moneyFormat={moneyFormat} />
        </ChartCard>
        <ChartCard
          title="One category over time"
          action={
            <select aria-label="Category" className={`${inputBase} w-auto max-w-full py-1.5 text-sm`} value={trendId ?? ''} onChange={(e) => setPickedCategory(e.target.value)}>
              {v.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          }
        >
          {trendCategory && (
            <CategoryTrendChart months={v.months} values={trendValues} average={averageMonthly(trendValues)} label={trendCategory.name} color={trendCategory.color} moneyFormat={moneyFormat} />
          )}
        </ChartCard>
        <ChartCard title="Fixed vs variable" subtitle="What is locked in and what you can change">
          <FixedVariableChart series={v.series} moneyFormat={moneyFormat} />
        </ChartCard>
      </div>

      <ChartCard title="Month by month" subtitle="Change compares the last two months: ▲ spent more, ▼ spent less">
        <MonthOverMonthTable months={v.months} rows={v.momRows} totals={v.series.map((p) => p.spent)} moneyFormat={moneyFormat} />
      </ChartCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title={`Budget vs actual, ${endLabel}`}>
          <BudgetVsActualTable rows={v.budgetRows} categories={v.byId} moneyFormat={moneyFormat} />
        </ChartCard>
        <ChartCard title="Top 5 largest expenses" subtitle="Not counting fixed costs like rent">
          <TopExpenses expenses={v.top} categories={v.byId} moneyFormat={moneyFormat} />
        </ChartCard>
      </div>

      </>
      )}

      <ChartCard title="Export" subtitle={`Expenses from ${rangeLabel}`}>
        <ExportButtons
          label="Export CSV"
          fileName={`budget-expenses-${from}-to-${to}.csv`}
          type="text/csv"
          build={async () => expensesToCsv(v.expenses, v.categories, await db.fixedTemplates.toArray(), moneyFormat.currency)}
        />
      </ChartCard>

      {SHOW_TEST_TOOLS && <SampleDataPanel />}
    </div>
  );
}
