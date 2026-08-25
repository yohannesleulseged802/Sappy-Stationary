import Icon from "./Icon";

export default function EmptyState({ icon = "inbox", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center">
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <div className="mt-3 font-display text-lg">{title}</div>
      {hint && <div className="text-sm text-emerald-900/50 mt-1 max-w-xs mx-auto">{hint}</div>}
    </div>
  );
}