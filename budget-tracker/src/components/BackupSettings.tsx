import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { buildBackupNow, markBackedUp, readAllData } from '../db/backupActions';
import { SETTINGS_ID } from '../db/types';
import { backupFileName } from '../lib/backup';
import { expensesToCsv } from '../lib/csv';
import ExportButtons from './ExportButtons';
import RestoreBackup from './RestoreBackup';

export default function BackupSettings() {
  const settings = useLiveQuery(() => db.settings.get(SETTINGS_ID), []);
  const last = settings?.lastBackupAt;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-medium">Backup</h3>
        <p className="mb-2 mt-1 text-sm text-slate-600">
          Your data is stored only on this device. A backup file holds everything and can be restored here or on another device.
          Last backup: <strong>{last ? new Date(last).toLocaleDateString() : 'never'}</strong>.
        </p>
        <ExportButtons
          label="Download backup"
          fileName={backupFileName()}
          type="application/json"
          build={async () => JSON.stringify(await buildBackupNow(), null, 1)}
          onDone={() => void markBackedUp()}
        />
      </div>
      <div>
        <h3 className="font-medium">All expenses as CSV</h3>
        <p className="mb-2 mt-1 text-sm text-slate-600">Opens in Excel, Numbers or Google Sheets. Use the Trends page to export one date range.</p>
        <ExportButtons
          label="Export CSV"
          fileName="budget-expenses-all.csv"
          type="text/csv"
          build={async () => {
            const d = await readAllData();
            return expensesToCsv(d.expenses, d.categories, d.fixedTemplates, d.settings[0]?.currency ?? 'EUR');
          }}
        />
      </div>
      <RestoreBackup />
    </div>
  );
}
