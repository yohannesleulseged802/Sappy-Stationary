"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import KpiTile from "@/components/ui/KpiTile";
import PurchaseForm from "@/components/modules/PurchaseForm";
import { fmt, num } from "@/lib/money";
import { toLocalDate } from "@/lib/utils";

export default function PurchasesPage() {
  const [pos, setPos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  async function load() {
    const r = await fetch("/api/purchases"); const j = await r.json(); setPos(j);
  }
  useEffect(() => { load(); }, []);

  const totalSpend = pos.filter(p => p.status === "received").reduce((s, p) => s + num(p.total), 0);

  async function receive(id: string) {
    await fetch(`/api/purchases/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "received" }) });
    load();
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl">Purchase orders</h1>
          <p className="text-emerald-800/70">Receive stock and update costs.</p>
        </div>
        <button onClick={() => { setEdit(null); setShowForm(true); }} className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold">+ New PO</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiTile label="Total POs" value={pos.length} />
        <KpiTile label="Received spend" value={fmt(totalSpend)} />
        <KpiTile label="Drafts" value={pos.filter(p => p.status === "draft").length} />
        <KpiTile label="Ordered" value={pos.filter(p => p.status === "ordered").length} />
      </div>

      <Card>
        <div className="divide-y divide-emerald-100">
          {pos.length === 0 && <p className="py-6 text-center text-emerald-800/60">No purchase orders yet.</p>}
          {pos.map(p => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="font-medium">{p.poNumber} • {p.supplier}</div>
                <div className="text-xs text-emerald-800/60">{toLocalDate(p.date)} • by {p.userName}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-display text-lg">{fmt(p.total)}</div>
                <span className={`text-xs rounded-full px-2 py-1 ${
                  p.status === "received" ? "bg-emerald-100 text-emerald-700" :
                  p.status === "ordered" ? "bg-amber-100 text-amber-700" :
                  "bg-stone-100 text-stone-700"
                }`}>{p.status}</span>
                {p.status !== "received" && (
                  <button onClick={() => receive(p.id)} className="text-xs rounded-full bg-emerald-600 text-white px-3 py-1">Receive</button>
                )}
                <button onClick={() => { setEdit(p); setShowForm(true); }} className="text-xs rounded-full bg-stone-100 text-stone-700 px-3 py-1">View</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showForm && <PurchaseForm initial={edit} onClose={() => { setShowForm(false); setEdit(null); }} onSaved={() => { setShowForm(false); setEdit(null); load(); }} />}
    </div>
  );
}