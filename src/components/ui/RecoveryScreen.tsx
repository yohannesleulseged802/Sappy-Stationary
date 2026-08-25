"use client";
import { useState } from "react";
export default function RecoveryScreen({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState("idle");
  async function repair() {
    setStatus("working");
    const r = await fetch("/api/repair", { method: "POST" });
    const j = await r.json();
    setStatus(j.ok ? "ok" : "fail");
  }
  return (
    <div className="fixed inset-0 z-[60] bg-cream grid place-items-center p-6">
      <div className="max-w-md w-full bg-white/80 backdrop-blur rounded-2xl shadow-soft p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500 text-white grid place-items-center text-3xl">!</div>
        <h2 className="font-display text-2xl mt-3">Something went sideways</h2>
        <p className="text-sm text-emerald-800/70 mt-1">One tap to repair the database schema.</p>
        <button onClick={repair} disabled={status==="working"} className="mt-5 w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold">
          {status==="working" ? "Repairing…" : "Repair database"}
        </button>
        {status === "ok" && <p className="mt-3 text-emerald-700">Repaired! <button onClick={onDone} className="underline">Continue</button></p>}
        {status === "fail" && <p className="mt-3 text-red-600">Repair failed. Check DATABASE_URL.</p>}
      </div>
    </div>
  );
}