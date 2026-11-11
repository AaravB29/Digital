import { useTheme, type ThemePreference } from '../hooks/useTheme';

const OPTIONS: Array<[ThemePreference, string]> = [['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']];

export default function AppearanceSettings() {
  const { preference, setPreference } = useTheme();
  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
        {OPTIONS.map(([value, label]) => (
          <label
            key={value}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal-600 ${
              preference === value ? 'bg-teal-700 text-white' : 'hover:bg-slate-100'
            }`}
          >
            <input type="radio" name="theme" value={value} className="sr-only" checked={preference === value} onChange={() => setPreference(value)} />
            {label}
          </label>
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-500">Saved on this device only.</p>
    </fieldset>
  );
}
