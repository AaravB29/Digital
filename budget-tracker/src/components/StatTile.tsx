interface Props {
  label: string;
  value: string;
  detail?: string;
  tone?: 'default' | 'good' | 'bad';
}

const TONES = { default: 'text-slate-900', good: 'text-emerald-700', bad: 'text-red-700' };

export default function StatTile({ label, value, detail, tone = 'default' }: Props) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-xl font-semibold ${TONES[tone]}`}>{value}</p>
      {detail && <p className="text-sm text-slate-500">{detail}</p>}
    </div>
  );
}
