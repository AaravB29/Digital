import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AppearanceSettings from '../components/AppearanceSettings';
import BackupSettings from '../components/BackupSettings';
import CategoryManager from '../components/CategoryManager';
import CurrencySettings from '../components/CurrencySettings';
import FixedTemplateManager from '../components/FixedTemplateManager';
import { isDesktop } from '../desktop/platform';

function Section({ id, title, intro, children }: { id?: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {intro && <p className="mt-1 text-sm text-slate-600">{intro}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { hash } = useLocation();
  // Sections above load from the database first, so wait a moment before jumping to #backup.
  useEffect(() => {
    if (!hash) return;
    const timer = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 250);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Section title="Fixed expenses" intro="These appear in every month automatically. To change a single month, edit it in the month view.">
        <FixedTemplateManager />
      </Section>
      <Section title="Categories" intro="Order here is the order of the tabs. Archived categories leave the tabs but keep their history.">
        <CategoryManager />
      </Section>
      <Section title="Currency">
        <CurrencySettings />
      </Section>
      <Section title="Appearance">
        <AppearanceSettings />
      </Section>
      <Section id="backup" title="Backup and export">
        <BackupSettings />
      </Section>
      <p className="text-sm text-slate-500">Budget Tracker v{__APP_VERSION__}{isDesktop() ? ' · Windows app' : ''}</p>
    </div>
  );
}
