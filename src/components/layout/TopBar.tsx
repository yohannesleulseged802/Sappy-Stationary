"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import MobileSheet from "./MobileSheet";
import Icon from "@/components/ui/Icon";
import Logo from "@/components/ui/Logo";
import Modal from "@/components/ui/Modal";

function fileToAvatar(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const size = 128;
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const x = c.getContext("2d")!;
      const m = Math.min(img.width, img.height);
      x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = rej;
    img.src = url;
  });
}

export default function TopBar({ onRepair }: { onRepair: () => void }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [me, setMe] = useState<any>(null);
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

  useEffect(() => {
    if (session?.user) fetch("/api/me").then(r => r.json()).then(setMe).catch(() => {});
  }, [session]);

  const name: string = me?.name || (session?.user as any)?.name || "Owner";
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  async function uploadAvatar(f: File) {
    try {
      const dataUrl = await fileToAvatar(f);
      const r = await fetch("/api/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar: dataUrl }) });
      const j = await r.json();
      if (j.ok) setMe(j.user); else alert(j.error || "Could not save photo");
    } catch { alert("Could not read that image"); }
  }

  async function removeAvatar() {
    const r = await fetch("/api/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar: "" }) });
    const j = await r.json();
    if (j.ok) setMe(j.user);
  }

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
            <button onClick={() => setProfileOpen(true)} title="Your profile"
              className="hidden md:flex items-center gap-2 rounded-full bg-white/70 border border-emerald-100 pl-1 pr-3 py-1 hover:bg-white transition">
              {me?.avatar
                ? <img src={me.avatar} alt={name} className="w-7 h-7 rounded-full object-cover" />
                : <span className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center text-[11px] font-bold">{initials}</span>}
              <span className="text-sm font-medium text-emerald-900/80 truncate max-w-[10rem]">{name}</span>
            </button>
            <button onClick={() => setOpen(true)}
              className="md:hidden grid w-9 h-9 rounded-xl border border-emerald-100 bg-white/70 text-emerald-800 place-items-center">
              <Icon name="menu" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileSheet open={open} onClose={() => setOpen(false)} onRepair={onRepair} />

      {profileOpen && (
        <Modal open={true} onClose={() => setProfileOpen(false)} title="Your profile">
          <div className="text-center">
            {me?.avatar
              ? <img src={me.avatar} alt={name} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-emerald-100" />
              : <div className="w-24 h-24 rounded-full bg-emerald-600 text-white grid place-items-center text-3xl font-bold mx-auto">{initials}</div>}
            <div className="mt-3 font-display text-xl">{name}</div>
            <div className="text-sm text-emerald-900/60">{me?.email || ""} • <span className="uppercase text-xs font-bold">{me?.role || "staff"}</span></div>
            <div className="flex gap-2 justify-center mt-5">
              <label className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-emerald-700 transition flex items-center gap-2">
                <Icon name="camera" className="w-4 h-4" /> Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
              </label>
              {me?.avatar && (
                <button onClick={removeAvatar} className="rounded-xl border border-red-200 text-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-50 transition">
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-emerald-900/50 mt-4">Your photo shows on your badge across the shop.</p>
          </div>
        </Modal>
      )}
    </>
  );
}