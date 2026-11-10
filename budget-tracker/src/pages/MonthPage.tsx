import { useParams } from 'react-router-dom';

export default function MonthPage() {
  const { monthKey } = useParams();
  return (
    <section>
      <h1 className="text-2xl font-semibold">Month</h1>
      <p className="mt-2 text-slate-500">Viewing {monthKey}. Expenses will appear here.</p>
    </section>
  );
}
