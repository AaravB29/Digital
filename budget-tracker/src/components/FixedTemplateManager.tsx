import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { removeTemplate, saveTemplate } from '../db/fixedActions';
import type { FixedExpenseTemplate } from '../db/types';
import { useMoneyFormat } from '../hooks/useExpenses';
import { isTemplateActive } from '../lib/fixed';
import { formatMoney } from '../lib/money';
import { currentMonthKey, formatMonthLabel } from '../lib/months';
import FixedTemplateForm from './FixedTemplateForm';
import { secondaryButton } from './fieldStyles';

const KIND_ORDER: FixedExpenseTemplate['kind'][] = ['rent', 'health_insurance', 'subscription', 'other_fixed'];

export default function FixedTemplateManager() {
  const templates = useLiveQuery(
    () => db.fixedTemplates.toArray().then((ts) => ts.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.name.localeCompare(b.name))),
    [],
  );
  const moneyFormat = useMoneyFormat();
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const thisMonth = currentMonthKey();

  if (!templates) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {templates.map((t) =>
          editingId === t.id ? (
            <li key={t.id} className="bg-teal-50/60 p-4">
              <FixedTemplateForm
                initial={t}
                locale={moneyFormat.locale}
                onCancel={() => setEditingId(null)}
                onSave={async (input, scope) => {
                  await saveTemplate(t.id, input, scope);
                  setEditingId(null);
                }}
              />
            </li>
          ) : (
            <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className={isTemplateActive(t, thisMonth) ? '' : 'text-slate-500'}>{t.name}</p>
                <p className="text-xs text-slate-500">
                  Day {t.dayOfMonth} · from {formatMonthLabel(t.activeFrom)}
                  {t.activeUntil ? ` until ${formatMonthLabel(t.activeUntil)}` : ''}
                </p>
              </div>
              <span className="font-medium tabular-nums">{formatMoney(t.defaultAmount, moneyFormat)}</span>
              {confirmRemoveId === t.id ? (
                <div className="flex w-full flex-wrap items-center gap-2 text-sm">
                  <span className="flex-1">Remove {t.name}? Past months keep their entries.</span>
                  <button type="button" className="rounded-lg bg-red-700 px-3 py-1.5 text-white hover:bg-red-800" onClick={() => void removeTemplate(t.id)}>Remove</button>
                  <button type="button" className="rounded-lg px-3 py-1.5 hover:bg-slate-100" onClick={() => setConfirmRemoveId(null)}>Keep</button>
                </div>
              ) : (
                <div className="flex">
                  <button type="button" aria-label={`Edit ${t.name}`} className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setEditingId(t.id)}>✏️</button>
                  <button type="button" aria-label={`Remove ${t.name}`} className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setConfirmRemoveId(t.id)}>🗑️</button>
                </div>
              )}
            </li>
          ),
        )}
        {templates.length === 0 && <li className="px-4 py-6 text-center text-slate-500">No fixed expenses yet.</li>}
      </ul>
      {editingId === 'new' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <FixedTemplateForm
            locale={moneyFormat.locale}
            onCancel={() => setEditingId(null)}
            onSave={async (input) => {
              await saveTemplate(null, input);
              setEditingId(null);
            }}
          />
        </div>
      ) : (
        <button type="button" className={`${secondaryButton} self-start`} onClick={() => setEditingId('new')}>+ Add fixed expense</button>
      )}
    </div>
  );
}
