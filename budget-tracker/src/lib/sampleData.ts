import type { Expense, FixedExpenseKind, Income, MonthKey } from '../db/types';

export const SAMPLE_PREFIX = 'sample:';

/** Small seeded random generator, so the same seed always gives the same data. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Spec {
  categoryId: string;
  notes: string[];
  /** Min and max per entry, in cents. */
  range: [number, number];
  /** Min and max entries per month. */
  count: [number, number];
}

const VARIABLE: Spec[] = [
  { categoryId: 'groceries', notes: ['Rewe', 'Aldi', 'Lidl', 'Edeka', 'Bakery', 'Farmers market'], range: [650, 6500], count: [6, 10] },
  { categoryId: 'eating-out', notes: ['Pizza', 'Mensa', 'Döner', 'Coffee with friends', 'Sushi'], range: [350, 3200], count: [3, 6] },
  { categoryId: 'transport', notes: ['Bike repair', 'Taxi', 'Regional train'], range: [300, 2400], count: [0, 2] },
  { categoryId: 'shopping', notes: ['Clothes', 'Drugstore', 'Kitchen stuff', 'Shoes'], range: [800, 7500], count: [0, 3] },
  { categoryId: 'education', notes: ['Textbook', 'Printing', 'Online course'], range: [500, 4500], count: [0, 2] },
  { categoryId: 'health', notes: ['Pharmacy', 'Vitamins', 'Physio co-pay'], range: [400, 2500], count: [0, 2] },
  { categoryId: 'leisure', notes: ['Cinema', 'Concert', 'Climbing gym', 'Bar'], range: [800, 4000], count: [1, 3] },
  { categoryId: 'other', notes: ['Gift', 'Haircut', 'Laundry'], range: [300, 3000], count: [0, 2] },
];

const FIXED: Array<{ kind: FixedExpenseKind; note: string; amount: number; lastMonthIndex?: number }> = [
  { kind: 'rent', note: 'Rent', amount: 65000 },
  { kind: 'health_insurance', note: 'Health Insurance', amount: 12050 },
  { kind: 'subscription', note: 'Mobile plan', amount: 1500 },
  { kind: 'subscription', note: 'Spotify', amount: 1099 },
  { kind: 'subscription', note: 'Netflix', amount: 1399, lastMonthIndex: 3 },
];

export interface SampleExpense extends Expense {
  /** Set on fixed rows, so they can be skipped where a real fixed row already exists. */
  fixedKind?: FixedExpenseKind;
}

/** Six months (or however many are given) of believable student spending, in whole cents. */
export function generateSampleData(months: MonthKey[], seed = 42): { expenses: SampleExpense[]; incomes: Income[] } {
  const rand = mulberry32(seed);
  const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const day = () => String(between(1, 28)).padStart(2, '0');
  const expenses: SampleExpense[] = [];
  const incomes: Income[] = [];
  let n = 0;
  const push = (month: MonthKey, date: string, amount: number, categoryId: string, note: string, fixedKind?: FixedExpenseKind) =>
    expenses.push({ id: `${SAMPLE_PREFIX}${month}:${n++}`, month, date, amount, categoryId, note, createdAt: `${date}T12:00:00.000Z`, fixedKind, isPaid: fixedKind ? true : undefined });

  months.forEach((month, i) => {
    incomes.push({ id: `${SAMPLE_PREFIX}${month}:job`, month, amount: between(100000, 115000), source: 'Part-time job' });
    incomes.push({ id: `${SAMPLE_PREFIX}${month}:parents`, month, amount: 45000, source: 'Parents' });
    for (const f of FIXED) {
      if (f.lastMonthIndex === undefined || i <= f.lastMonthIndex) push(month, `${month}-01`, f.amount, 'fixed', f.note, f.kind);
    }
    push(month, `${month}-01`, 4900, 'transport', 'Deutschlandticket');
    for (const spec of VARIABLE) {
      const count = between(spec.count[0], spec.count[1]);
      for (let k = 0; k < count; k++) {
        // Round to 10 cents so amounts look like real receipts.
        const amount = Math.round(between(spec.range[0], spec.range[1]) / 10) * 10;
        push(month, `${month}-${day()}`, amount, spec.categoryId, spec.notes[between(0, spec.notes.length - 1)]);
      }
    }
    if (i === 2) push(month, `${month}-${day()}`, between(14000, 26000), 'travel', 'Weekend trip to Hamburg');
  });
  return { expenses, incomes };
}
