"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Icon from "@/components/ui/Icon";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/inventory", label: "Inventory", icon: "box" },
  { href: "/sales", label: "Sales", icon: "cash" },
  { href: "/credits", label: "Credits", icon: "book" },
  { href: "/purchases", label: "Purchases", icon: "cart" },
  { href: "/reports", label: "Reports", icon: "chart" },
  { href: "/expenses", label: "Expenses", icon: "wallet" },
  { href: "/activity", label: "Activity", icon: "clock" },
];
const TRAIL = [
  { href: "/security", label: "Security", icon: "lock" },
  { href: "/users", label: "Users", icon: "users" },
  { href: "/devices", label: "Devices", icon: "phone" },
];

function PillLink({ href, label, icon, active }: any) {
  return (
    <Link href={href} title={label}
      className={`group flex items-center gap-2 rounded-full px-3 py-2 transition-all duration-300 shrink-0 ${
        active ? "bg-emerald-600 text-white shadow-md" : "text-emerald-900/70 hover:bg-emerald-50 hover:text-emerald-800"
      }`}>
      <Icon name={icon} className="w-5 h-5 shrink-0" />
      <span className={`text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ${
        active ? "max-w-[10rem]" : "max-w-0 group-hover:max-w-[10rem]"
      }`}>{label}</span>
    </Link>
  );
}

export default function NavPill({ current }: { current: string }) {
  return (
    <div className="hidden md:flex fixed top-16 left-1/2 -translate-x-1/2 z-30 w-full px-4 justify-center pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-emerald-100 bg-white/90 backdrop-blur shadow-soft p-1.5 max-w-full overflow-x-auto no-scrollbar">
        {ITEMS.map(it => (
          <PillLink key={it.href} {...it} active={current === it.href} />
        ))}
        <span className="w-px h-6 bg-emerald-100 mx-1 shrink-0" />
        {TRAIL.map(it => (
          <PillLink key={it.href} {...it} active={current === it.href} />
        ))}
        <button title="Reset all data (master code required)"
          onClick={() => window.dispatchEvent(new CustomEvent("sappy-reset"))}
          className="group flex items-center gap-2 rounded-full px-3 py-2 text-amber-600 hover:bg-amber-50 transition-all duration-300 shrink-0">
          <Icon name="trash" className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[10rem] transition-all duration-300">Reset</span>
        </button>
        <button title="Sign out"
          onClick={async () => { await signOut({ callbackUrl: "/login" }); }}
          className="group flex items-center gap-2 rounded-full px-3 py-2 text-red-500 hover:bg-red-50 transition-all duration-300 shrink-0">
          <Icon name="logout" className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[10rem] transition-all duration-300">Sign out</span>
        </button>
      </nav>
    </div>
  );
}