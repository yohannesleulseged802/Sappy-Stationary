"use client";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

const TABS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/inventory", label: "Stock", icon: "box" },
  { href: "/sales", label: "Sales", icon: "cash" },
  { href: "/expenses", label: "Costs", icon: "wallet" },
  { href: "/reports", label: "Reports", icon: "chart" },
];

export default function BottomTabs({ current }: { current: string }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-emerald-100">
      <div className="grid grid-cols-5">
        {TABS.map(t => {
          const active = current === t.href;
          return (
            <Link key={t.href} href={t.href}
              className={`relative py-2.5 text-center transition ${active ? "text-emerald-700" : "text-emerald-900/50"}`}>
              <div className="flex justify-center"><Icon name={t.icon} className="w-5 h-5" /></div>
              <div className="text-[10px] font-medium mt-0.5">{t.label}</div>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-600" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}