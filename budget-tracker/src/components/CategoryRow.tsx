import type { Category } from '../db/types';
import { setCategoryArchived } from '../db/categoryActions';
import { formatMoney, type MoneyFormat } from '../lib/money';

interface Props {
  category: Category;
  isFirst: boolean;
  isLast: boolean;
  moneyFormat: MoneyFormat;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const iconButton = 'rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-teal-600';

export default function CategoryRow({ category: c, isFirst, isLast, moneyFormat, onMove, onEdit, onDelete }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <div className="flex flex-col">
        <button type="button" aria-label={`Move ${c.name} up`} className={`${iconButton} py-0.5 text-xs`} disabled={isFirst} onClick={() => onMove(-1)}>▲</button>
        <button type="button" aria-label={`Move ${c.name} down`} className={`${iconButton} py-0.5 text-xs`} disabled={isLast} onClick={() => onMove(1)}>▼</button>
      </div>
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
      <div className={`min-w-0 flex-1 ${c.archived ? 'text-slate-500' : ''}`}>
        <p className="truncate">
          {c.icon && <span aria-hidden>{c.icon} </span>}
          {c.name}
          {c.archived && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">archived</span>}
        </p>
        <p className="text-xs text-slate-500">
          {c.isFixed ? 'Holds your fixed expenses' : c.monthlyBudget ? `Budget ${formatMoney(c.monthlyBudget, moneyFormat)} / month` : 'No budget'}
        </p>
      </div>
      <div className="flex">
        <button type="button" aria-label={`Edit ${c.name}`} className={iconButton} onClick={onEdit}>✏️</button>
        {!c.isFixed && (
          <>
            <button type="button" className={`${iconButton} text-sm`} onClick={() => void setCategoryArchived(c.id, !c.archived)}>
              {c.archived ? 'Unarchive' : 'Archive'}
            </button>
            <button type="button" aria-label={`Delete ${c.name}`} className={iconButton} onClick={onDelete}>🗑️</button>
          </>
        )}
      </div>
    </div>
  );
}
