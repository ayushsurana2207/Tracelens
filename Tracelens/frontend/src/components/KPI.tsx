type Props = { title: string; value: string; sub?: string };
export default function KPI({ title, value, sub }: Props) {
  return (
    <div className="kpi">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
