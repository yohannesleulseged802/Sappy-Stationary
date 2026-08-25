export default function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
      <div className="h-full bg-emerald-600 transition-all" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}