import { cls } from "@/lib/utils";

export default function Card({ title, children, className }: any) {
  return (
    <div className={cls("bg-white/85 backdrop-blur rounded-2xl shadow-soft p-5 lift", className)}>
      {title && <h3 className="font-display text-xl mb-3">{title}</h3>}
      {children}
    </div>
  );
}