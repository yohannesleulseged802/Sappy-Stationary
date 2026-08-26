"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import MobileSheet from "./MobileSheet";
import Icon from "@/components/ui/Icon";
import Logo from "@/components/ui/Logo";

export default function TopBar({ onRepair }: { onRepair: () => void }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showBar, setShowBar] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setShowBar(true);
    setProgress(20);
    const t1 = setTimeout(() => setProgress(80), 60);
    const t2 = setTimeout(() => setProgress(100), 320);
    const t3 = setTimeout(() => setShowBar(false), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pathname]);

  const name: string = (session?.user as any)?.name || "Owner";
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-cream/80 backdrop-blur border-b border-emerald-100/70">
        <div className="h-0.5 w-full bg-emerald-100/50">
          <div className={`h-full bg-emerald-500 transition-all duration-300 ${showBar ? "opacity-100" : "opacity-0"}`}
            style={{ width: `${progress}%` }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo className="w-9 h-9" />
            <div className="font-display text-lg truncate hidden sm:block">Sappy Stationary</div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onRepair} title="Repair database"
              className="hidden md:grid w-9 h-9 rounded-xl border border-emerald-100 bg-white/70 text-emerald-700 place-items-center hover:bg-emerald-50 transition">
              <Icon name="repair" className="w-4 h-4" />
            </button>
            <div className="hidden md:flex items-center gap-2 rounded-full bg-white/70 border border-emerald-100 pl-1 pr-3 py-1">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center text-[11px] font-bold">{initials}</span>
              <span className="text-sm font-medium text-emerald-900/80 truncate max-w-[10rem]">{name}</span>
            </div>
            <button onClick={() => setOpen(true)}
              className="md:hidden grid w-9 h-9 rounded-xl border border-emerald-100 bg-white/70 text-emerald-800 place-items-center">
              <Icon name="menu" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <MobileSheet open={open} onClose={() => setOpen(false)} onRepair={onRepair} />
    </>
  );
}