import CategoryManager from '../components/CategoryManager';
import FixedTemplateManager from '../components/FixedTemplateManager';
import { useMoneyFormat } from '../hooks/useExpenses';

export default function SettingsPage() {
  const { currency, locale } = useMoneyFormat();
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
        <h2 className="text-lg font-semibold">Categories</h2>
        <p className="mb-3 mt-1 text-sm text-slate-600">
          Order here is the order of the tabs. Archived categories leave the tabs but keep their history.
        </p>
        <CategoryManager />
      </section>
      <p className="text-sm text-slate-500">Currency: {currency} · Number format: {locale}</p>
    </div>
  );
}
