"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/Icon";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/inventory", label: "Inventory", icon: "box" },
  { href: "/sales", label: "Sales", icon: "cash" },
  { href: "/credits", label: "Credits", icon: "book" },
  { href: "/purchases", label: "Purchases", icon: "cart" },
  { href: "/reports", label: "Reports", icon: "chart" },
  { href: "/expenses", label: "Expenses", icon: "wallet" },
  { href: "/activity", label: "Activity", icon: "clock" },
  { href: "/security", label: "Security", icon: "lock" },
  { href: "/users", label: "Users", icon: "users" },
  { href: "/devices", label: "Devices", icon: "phone" },
];

export default function MobileSheet({ open, onClose, onRepair }: any) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 z-50 max-h-[80vh] overflow-auto">
            <div className="mx-auto w-10 h-1 rounded-full bg-emerald-100 mb-4" />
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-xl">Menu</div>
              <button onClick={onClose} className="grid w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 place-items-center">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LINKS.map(l => (
                <Link key={l.href} href={l.href} onClick={onClose}
                  className="rounded-xl bg-emerald-50/70 px-3 py-3 text-sm font-medium text-emerald-900 flex items-center gap-2 min-w-0">
                  <span className="text-emerald-700 shrink-0"><Icon name={l.icon} className="w-4 h-4" /></span>
                  <span className="truncate">{l.label}</span>
                </Link>
              ))}
              <button onClick={() => { onClose(); onRepair?.(); }}
                className="rounded-xl bg-amber-50 px-3 py-3 text-sm font-medium text-amber-800 flex items-center gap-2">
                <Icon name="repair" className="w-4 h-4 shrink-0" />Repair DB
              </button>
              <button onClick={async () => { await signOut({ callbackUrl: "/login" }); }}
                className="rounded-xl bg-red-50 px-3 py-3 text-sm font-medium text-red-700 flex items-center gap-2">
                <Icon name="logout" className="w-4 h-4 shrink-0" />Sign out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}