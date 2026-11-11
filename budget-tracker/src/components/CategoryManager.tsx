import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { addCategory, reorderCategory, updateCategory } from '../db/categoryActions';
import { useMoneyFormat } from '../hooks/useExpenses';
import CategoryDeletePanel from './CategoryDeletePanel';
import CategoryForm from './CategoryForm';
import CategoryRow from './CategoryRow';
import { secondaryButton } from './fieldStyles';

type Mode = { kind: 'edit' | 'delete'; id: string } | { kind: 'new' } | null;

export default function CategoryManager() {
  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray(), []);
  const moneyFormat = useMoneyFormat();
  const [mode, setMode] = useState<Mode>(null);

  if (!categories) return <p className="text-slate-500">Loading…</p>;
  const close = () => setMode(null);

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {categories.map((c, i) => {
          const editing = mode?.kind === 'edit' && mode.id === c.id;
          const deleting = mode?.kind === 'delete' && mode.id === c.id;
          return (
            <li key={c.id} className={`flex flex-col gap-3 px-3 py-2 ${editing ? 'bg-teal-50/60 py-4' : ''}`}>
              {editing ? (
                <CategoryForm
                  initial={c}
                  others={categories.filter((o) => o.id !== c.id)}
                  locale={moneyFormat.locale}
                  onCancel={close}
                  onSave={async (input) => {
                    await updateCategory(c.id, input);
                    close();
                  }}
                />
              ) : (
                <CategoryRow
                  category={c}
                  isFirst={i === 0}
                  isLast={i === categories.length - 1}
                  moneyFormat={moneyFormat}
                  onMove={(dir) => void reorderCategory(c.id, dir)}
                  onEdit={() => setMode({ kind: 'edit', id: c.id })}
                  onDelete={() => setMode({ kind: 'delete', id: c.id })}
                />
              )}
              {deleting && (
                <CategoryDeletePanel category={c} targets={categories.filter((o) => o.id !== c.id && !o.archived)} onDone={close} />
              )}
            </li>
          );
        })}
      </ul>
      {mode?.kind === 'new' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <CategoryForm
            others={categories}
            locale={moneyFormat.locale}
            onCancel={close}
            onSave={async (input) => {
              await addCategory(input);
              close();
            }}
          />
        </div>
      ) : (
        <button type="button" className={`${secondaryButton} self-start`} onClick={() => setMode({ kind: 'new' })}>+ Add category</button>
      )}
    </div>
  );
}
