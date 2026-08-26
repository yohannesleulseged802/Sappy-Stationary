import { cls } from "@/lib/utils";

export default function Logo({ className = "w-9 h-9", rounded = "rounded-xl" }: { className?: string; rounded?: string }) {
  return (
    <img src="/logo.png" alt="Sappy Stationary" className={cls(className, rounded, "object-cover bg-white shadow-md shrink-0")} />
  );
}