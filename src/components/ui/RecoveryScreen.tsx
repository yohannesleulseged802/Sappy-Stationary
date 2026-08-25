"use client";
import { useState } from "react";
import Icon from "./Icon";

export default function RecoveryScreen({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "fail">("idle");

  async function repair() {
    setStatus("working");
    try {
      const r = await fetch("/api/repair", { method: "POST" });
      const j = await r.json();
      setStatus(j.ok ? "ok" : "fail");
    } catch {
      setStatus("fail");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-cream grid place-items-center p-6">
      <div className="max-w-md w-full bg-white/85 backdrop-blur rounded-2xl shadow-soft p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500 text-white grid place-items-center">
          <Icon name="alert" className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl mt-3">Database recovery</h2>
        <p className="text-sm text-emerald-900/60 mt-1">
          One tap to repair the schema. Your data is safe — this only rebuilds missing tables/columns.
        </p>
        <button onClick={repair} disabled={status === "working"}
          className="mt-5 w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 transition disabled:opacity-60">
          {status === "working" ? "Repairing…" : "Repair database"}
        </button>
        <button onClick={onDone}
          className="mt-2 w-full rounded-xl border border-emerald-200 bg-white py-3 font-semibold text-emerald-800 hover:bg-emerald-50 transition">
          Go back
        </button>
        {status === "ok" && (
          <p className="mt-3 text-emerald-700 font-medium">
            Repaired! <button onClick={onDone} className="underline">Continue</button>
          </p>
        )}
        {status === "fail" && (
          <p className="mt-3 text-red-600 text-sm">Repair failed. Check your internet / DATABASE_URL, then try again.</p>
        )}
      </div>
    </div>
  );
}