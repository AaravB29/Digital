import { useEffect, useId, useState } from 'react';
import type { Category } from '../db/types';
import { countCategoryExpenses, deleteCategory, moveExpensesAndDelete, setCategoryArchived } from '../db/categoryActions';
import { inputClass } from './fieldStyles';

interface Props {
  category: Category;
  targets: Category[];
  onDone: () => void;
}

/** Empty categories can be deleted; ones with expenses must be archived or emptied into another category first. */
export default function CategoryDeletePanel({ category, targets, onDone }: Props) {
  const id = useId();
  const [count, setCount] = useState<number | null>(null);
  const [targetId, setTargetId] = useState(targets[0]?.id ?? '');

  useEffect(() => {
    void countCategoryExpenses(category.id).then(setCount);
  }, [category.id]);

  const danger = 'rounded-lg bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-800';
  const plain = 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100';

  if (count === null) return <p className="text-sm text-slate-500">Checking for expenses…</p>;

  if (count === 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 text-sm">
        <span className="flex-1">Delete {category.name}? It has no expenses.</span>
        <button type="button" className={danger} onClick={() => void deleteCategory(category.id).then(onDone)}>Delete</button>
        <button type="button" className={plain} onClick={onDone}>Keep</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-amber-50 p-3 text-sm">
      <p>
        {category.name} has {count} {count === 1 ? 'expense' : 'expenses'}, so it can’t simply be deleted. Archive it to hide
        it but keep its history, or move its expenses to another category first.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {!category.archived && (
          <button type="button" className={plain} onClick={() => void setCategoryArchived(category.id, true).then(onDone)}>Archive instead</button>
        )}
        <label htmlFor={`${id}-to`} className="ml-auto">Move to</label>
        <select id={`${id}-to`} className={`${inputClass} w-auto py-1.5 text-sm`} value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          {targets.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <button type="button" className={danger} disabled={!targetId} onClick={() => void moveExpensesAndDelete(category.id, targetId).then(onDone)}>
          Move and delete
        </button>
        <button type="button" className={plain} onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}
