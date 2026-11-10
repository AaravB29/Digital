import FixedTemplateManager from '../components/FixedTemplateManager';
import SavedDataCheck from '../components/SavedDataCheck';

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section>
        <h2 className="text-lg font-semibold">Fixed expenses</h2>
        <p className="mb-3 mt-1 text-sm text-slate-600">
          These appear in every month automatically. To change a single month, edit it in the month view.
        </p>
        <FixedTemplateManager />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Categories</h2>
        <p className="mb-3 text-sm text-slate-600">Editing categories comes in the next phase.</p>
        <SavedDataCheck />
      </section>
    </div>
  );
}
