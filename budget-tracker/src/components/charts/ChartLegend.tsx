export interface LegendItem {
  label: string;
  color: string;
  value?: string;
  /** Draws a short line instead of a square, for line series. */
  line?: boolean;
  dashed?: boolean;
}

export default function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          {item.line ? (
            <span aria-hidden className="w-4 border-t-2" style={{ borderColor: item.color, borderStyle: item.dashed ? 'dashed' : 'solid' }} />
          ) : (
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          )}
          <span>{item.label}</span>
          {item.value && <span className="tabular-nums text-slate-500">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}
