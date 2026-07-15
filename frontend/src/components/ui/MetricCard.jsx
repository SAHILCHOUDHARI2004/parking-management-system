export default function MetricCard({ title, value, icon: Icon, accent, note }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-normal text-slate-950">{value}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="text-base" />
        </div>
      </div>
      <p className="mt-2.5 text-xs text-slate-500">{note}</p>
    </article>
  );
}
