"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import KpiTile from "@/components/ui/KpiTile";
import InventoryForm from "@/components/modules/InventoryForm";
import InventoryTable from "@/components/modules/InventoryTable";
import QrSheet from "@/components/modules/QrSheet";
import { fmt, num } from "@/lib/money";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  async function load() {
    const r = await fetch("/api/inventory"); const j = await r.json(); setItems(j);
  }
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(q.toLowerCase()) ||
    i.serial.toLowerCase().includes(q.toLowerCase()) ||
    i.category.toLowerCase().includes(q.toLowerCase())
  );

  const totalValue = items.reduce((s, i) => s + (i.costUnknown ? 0 : num(i.cost) * num(i.quantity)), 0);
  const totalUnits = items.reduce((s, i) => s + num(i.quantity), 0);
  const unknownCost = items.filter(i => i.costUnknown).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl">Inventory</h1>
          <p className="text-emerald-800/70">Your stock, organized and scannable.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSheet(true)} className="rounded-xl border border-emerald-600 text-emerald-700 px-4 py-2 font-semibold hover:bg-emerald-50">Print labels</button>
          <button onClick={() => { setEdit(null); setShowForm(true); }} className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700">+ Add item</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiTile label="Items" value={items.length} />
        <KpiTile label="Units" value={totalUnits} />
        <KpiTile label="Stock value" value={fmt(totalValue)} />
        <KpiTile label="Unknown cost" value={unknownCost} />
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 mb-3">
          <input placeholder="Search name, serial, category…" value={q} onChange={e=>setQ(e.target.value)}
            className="flex-1 min-w-0 rounded-xl border border-emerald-200 bg-white px-4 py-2" />
          <label className="rounded-xl border border-emerald-200 bg-white px-4 py-2 cursor-pointer hover:bg-emerald-50">
            Import Excel
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const fd = new FormData(); fd.append("file", f);
              const r = await fetch("/api/inventory?import=1", { method: "POST", body: fd });
              const j = await r.json(); alert(j.ok ? `Imported ${j.count} items` : `Error: ${j.error}`); load();
            }} />
          </label>
          <button onClick={async () => {
            const r = await fetch("/api/inventory?export=xlsx"); const b = await r.blob();
            const u = URL.createObjectURL(b); const a = document.createElement("a");
            a.href = u; a.download = "inventory.xlsx"; a.click();
          }} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 hover:bg-emerald-50">Export Excel</button>
          <button onClick={async () => {
            const r = await fetch("/api/inventory?export=pdf"); const b = await r.blob();
            const u = URL.createObjectURL(b); const a = document.createElement("a");
            a.href = u; a.download = "inventory.pdf"; a.click();
          }} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 hover:bg-emerald-50">Export PDF</button>
        </div>

        <InventoryTable
          items={filtered}
          selected={selected}
          setSelected={setSelected}
          onEdit={(i) => { setEdit(i); setShowForm(true); }}
          onDeleted={load}
        />
      </Card>

      {showForm && (
        <InventoryForm
          initial={edit}
          onClose={() => { setShowForm(false); setEdit(null); }}
          onSaved={() => { setShowForm(false); setEdit(null); load(); }}
        />
      )}

      {showSheet && (
        <QrSheet items={items} onClose={() => setShowSheet(false)} />
      )}
    </div>
  );
}