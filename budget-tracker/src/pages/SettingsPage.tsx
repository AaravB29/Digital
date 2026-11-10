import SavedDataCheck from '../components/SavedDataCheck';

export default function SettingsPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-2 text-slate-500">
        Editing fixed expenses, categories, currency and backup comes in later phases.
      </p>
      <h2 className="mt-8 mb-3 text-lg font-semibold">Saved data</h2>
      <SavedDataCheck />
    </section>
  );
}
