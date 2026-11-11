import { useId, useState, type ChangeEvent } from 'react';
import { restoreBackup } from '../db/backupActions';
import { parseBackup, type BackupFile } from '../lib/backup';

type State =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'confirm'; backup: BackupFile; summary: { expenses: number; incomes: number; months: number; exportedAt: string } }
  | { kind: 'done' };

export default function RestoreBackup() {
  const id = useId();
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const parsed = parseBackup(await file.text());
    setState(parsed.ok ? { kind: 'confirm', backup: parsed.backup, summary: parsed.summary } : { kind: 'error', message: parsed.error });
  }

  const when = (iso: string) => (iso ? new Date(iso).toLocaleString() : 'an unknown date');

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor={`${id}-file`} className="mb-1 block text-sm font-medium">Restore from a backup file</label>
        <input id={`${id}-file`} type="file" accept=".json,application/json" onChange={(e) => void onFile(e)}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-slate-900 hover:file:bg-slate-100" />
      </div>
      {state.kind === 'error' && <p role="alert" className="text-sm text-red-700">{state.message}</p>}
      {state.kind === 'done' && <p role="status" className="text-sm text-emerald-700">Restored. Everything now matches the backup.</p>}
      {state.kind === 'confirm' && (
        <div className="flex flex-col gap-2 rounded-lg bg-amber-50 p-3 text-sm">
          <p>
            Backup from <strong>{when(state.summary.exportedAt)}</strong>: {state.summary.expenses} expenses across {state.summary.months} months and{' '}
            {state.summary.incomes} income entries. Restoring <strong>replaces everything</strong> currently on this device.
          </p>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg bg-red-700 px-3 py-1.5 text-white hover:bg-red-800"
              onClick={() =>
                void restoreBackup(state.backup).then(
                  () => setState({ kind: 'done' }),
                  (e: unknown) => setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) }),
                )
              }>
              Replace with backup
            </button>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100" onClick={() => setState({ kind: 'idle' })}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
