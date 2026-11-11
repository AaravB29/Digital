import { useState } from 'react';
import { useMoneyFormat } from '../hooks/useExpenses';
import { useTrendsView } from '../hooks/useStats';
import { averageMonthly } from '../lib/stats';
import { formatMoney } from '../lib/money';
import { formatMonthLabel, presetRange } from '../lib/months';
import BudgetVsActualTable from '../components/BudgetVsActualTable';
import MonthOverMonthTable from '../components/MonthOverMonthTable';
import RangeSelector, { type RangeChoice } from '../components/RangeSelector';
import SampleDataPanel from '../components/SampleDataPanel';
import StatTile from '../components/StatTile';
import TopExpenses from '../components/TopExpenses';
import { inputClass } from '../components/fieldStyles';
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

  const trendId = pickedCategory && v.byId.has(pickedCategory) ? pickedCategory : v.rankedCategoryIds[0] ?? v.categories[0]?.id;
  const trendCategory = trendId ? v.byId.get(trendId) : undefined;
  const trendValues = (trendId && v.matrix.get(trendId)) || v.months.map(() => 0);
  const money = (cents: number) => formatMoney(cents, moneyFormat);
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Average per month" value={money(v.tiles.average)} detail="months with spending" />
        <StatTile label="Highest month" value={v.tiles.highest ? money(v.tiles.highest.spent) : '–'} detail={v.tiles.highest ? formatMonthLabel(v.tiles.highest.month) : 'no spending yet'} />
        <StatTile
          label="Biggest category"
          value={v.tiles.biggest?.category?.name ?? '–'}
          detail={v.tiles.biggest ? `${money(v.tiles.biggest.total)} · ${v.tiles.biggest.percent.toLocaleString(moneyFormat.locale)} %` : undefined}
        />
        <StatTile
          label="Savings rate"
          value={v.tiles.savings === null ? '–' : `${v.tiles.savings.toLocaleString(moneyFormat.locale)} %`}
          detail={v.tiles.savings === null ? 'add income to see it' : 'of income not spent'}
          tone={v.tiles.savings === null ? 'default' : v.tiles.savings < 0 ? 'bad' : 'good'}
        />
      </div>

      <ChartCard title="Spending and income per month">
        <SpendingIncomeChart series={v.series} moneyFormat={moneyFormat} />
      </ChartCard>

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
            <select aria-label="Category" className={`${inputClass} w-auto py-1.5 text-sm`} value={trendId ?? ''} onChange={(e) => setPickedCategory(e.target.value)}>
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

      {SHOW_TEST_TOOLS && <SampleDataPanel />}
    </div>
  );
}
