import { cls } from "@/lib/utils";
export default function Button({ children, variant = "primary", className, ...rest }: any) {
  const base = "rounded-xl px-4 py-2 font-semibold transition active:scale-[0.98]";
  const styles: any = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    ghost: "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  return <button className={cls(base, styles[variant], className)} {...rest}>{children}</button>;
}