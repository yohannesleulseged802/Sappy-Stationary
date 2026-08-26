"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import KpiTile from "@/components/ui/KpiTile";
import Icon from "@/components/ui/Icon";
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
    const r = await fetch("/api/inventory");
    const j = await r.json();
    setItems(j);
  }
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(q.toLowerCase()) ||
    i.serial.toLowerCase().includes(q.toLowerCase()) ||
    i.category.toLowerCase().includes(q.toLowerCase())
  );

  const totalValue = items.reduce((s, i) => s + num(i.price) * num(i.quantity), 0);
  const totalUnits = items.reduce((s, i) => s + num(i.quantity), 0);
  const unknownCost = items.filter(i => i.costUnknown || i.cost === null).length;

  async function download(url: string, filename: string) {
    const r = await fetch(url);
    const b = await r.blob();
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u; a.download = filename; a.click();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Inventory</h1>
          <p className="text-emerald-900/60">Your stock, organized and scannable.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSheet(true)}
            className="rounded-xl border border-emerald-600 text-emerald-700 px-4 py-2 font-semibold hover:bg-emerald-50 transition flex items-center gap-2">
            <Icon name="printer" className="w-4 h-4" /> Print labels
          </button>
          <button onClick={() => { setEdit(null); setShowForm(true); }}
            className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 transition flex items-center gap-2">
            <Icon name="plus" className="w-4 h-4" /> Add item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiTile label="Items" value={items.length} icon="box" />
        <KpiTile label="Units" value={totalUnits} icon="chart" />
        <KpiTile label="Stock value (sell)" value={fmt(totalValue)} icon="cash" />
        <KpiTile label="Unknown cost" value={unknownCost} icon="alert" />
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900/40"><Icon name="search" className="w-4 h-4" /></span>
            <input placeholder="Search name, serial, category…" value={q} onChange={e => setQ(e.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-white pl-9 pr-3 py-2" />
          </div>
          <button onClick={() => download("/api/inventory?export=template", "sappy-import-template.xlsx")}
            title="Download the Excel import template"
            className="rounded-xl border border-emerald-200 bg-white px-4 py-2 hover:bg-emerald-50 transition flex items-center gap-2">
            <Icon name="download" className="w-4 h-4" /> Template
          </button>
          <label className="rounded-xl border border-emerald-200 bg-white px-4 py-2 cursor-pointer hover:bg-emerald-50 transition flex items-center gap-2">
            <Icon name="upload" className="w-4 h-4" /> Import Excel
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const fd = new FormData(); fd.append("file", f);
              const r = await fetch("/api/inventory?import=1", { method: "POST", body: fd });
              const j = await r.json();
              alert(j.ok ? `Imported ${j.count} items${j.errors?.length ? `\n${j.errors.length} row errors:\n${j.errors.slice(0, 5).join("\n")}` : ""}` : `Error: ${j.error}`);
              load();
            }} />
          </label>
          <button onClick={() => download("/api/inventory?export=xlsx", "inventory.xlsx")}
            className="rounded-xl border border-emerald-200 bg-white px-4 py-2 hover:bg-emerald-50 transition flex items-center gap-2">
            <Icon name="download" className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => download("/api/inventory?export=pdf", "inventory.pdf")}
            className="rounded-xl border border-emerald-200 bg-white px-4 py-2 hover:bg-emerald-50 transition flex items-center gap-2">
            <Icon name="download" className="w-4 h-4" /> PDF
          </button>
        </div>
        <p className="text-xs text-emerald-900/50 mb-3">
          Import guide: <b>Template</b> → fill rows (Name, Category, Quantity, Location, Cost, Price) → <b>Import Excel</b>. Leave Cost empty to flag "cost unknown".
        </p>

        <InventoryTable
          items={filtered}
          selected={selected}
          setSelected={setSelected}
          onEdit={(i: any) => { setEdit(i); setShowForm(true); }}
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

      {showSheet && <QrSheet items={items} onClose={() => setShowSheet(false)} />}
    </div>
  );
}