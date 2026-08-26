"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import KpiTile from "@/components/ui/KpiTile";
import Icon from "@/components/ui/Icon";
import InventoryForm from "@/components/modules/InventoryForm";
import InventoryTable from "@/components/modules/InventoryTable";
import { fetchQrDataUrls, openLabelPrintWindow, chunk } from "@/components/modules/QrSheet";
import { fmt, num } from "@/lib/money";

const GRIDS = [
  { label: "2×2", c: 2, r: 2 },
  { label: "3×3", c: 3, r: 3 },
  { label: "4×4", c: 4, r: 4 },
  { label: "5×5", c: 5, r: 5 },
  { label: "6×6", c: 6, r: 6 },
  { label: "8×10", c: 8, r: 10 },
];

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [copies, setCopies] = useState<Record<string, number>>({});
  const [grid, setGrid] = useState(GRIDS[1]);
  const [printing, setPrinting] = useState(false);

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

  function toggleCopies(id: string, qty: number) {
    setCopies(c => ({ ...c, [id]: (c[id] || 1) === 1 ? Math.max(qty, 1) : 1 }));
  }

  async function printSheet() {
    if (!selected.length) return;
    setPrinting(true);
    try {
      const urls = await fetchQrDataUrls(selected);
      const entries: any[] = [];
      for (const id of selected) {
        const it = items.find(i => i.id === id);
        if (!it) continue;
        const n = Math.max(copies[id] || 1, 1);
        for (let k = 0; k < n; k++) entries.push({ name: it.name, serial: it.serial, qr: urls[id] || "" });
      }
      const pages = chunk(entries, grid.c * grid.r);
      openLabelPrintWindow(pages, grid.c, grid.r);
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Inventory</h1>
          <p className="text-emerald-900/60">Your stock, organized and scannable.</p>
        </div>
        <button onClick={() => { setEdit(null); setShowForm(true); }}
          className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 transition flex items-center gap-2">
          <Icon name="plus" className="w-4 h-4" /> Add item
        </button>
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
              alert(j.ok ? `${j.count} added, ${j.updated} updated${j.errors?.length ? `\n${j.errors.length} row errors:\n${j.errors.slice(0, 5).join("\n")}` : ""}` : `Error: ${j.error}`);
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
          Labels: tick items → pick a grid on the bottom bar (2×2 … 8×10) → press <b>x1</b> to print one label per unit (<b>xQTY</b>) → <b>Print sheet</b>.
        </p>

        <InventoryTable
          items={filtered}
          selected={selected}
          setSelected={setSelected}
          onEdit={(i: any) => { setEdit(i); setShowForm(true); }}
          onDeleted={load}
          copies={copies}
          onToggleCopies={toggleCopies}
        />
      </Card>

      {/* Floating label-sheet bar */}
      {selected.length > 0 && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 z-40">
          <div className="flex items-center gap-2 rounded-2xl md:rounded-full border border-emerald-100 bg-white/95 backdrop-blur shadow-soft px-3 py-2 max-w-[95vw] overflow-x-auto no-scrollbar">
            <span className="text-sm font-semibold text-emerald-900 whitespace-nowrap">{selected.length} selected</span>
            <span className="w-px h-6 bg-emerald-100 shrink-0" />
            {GRIDS.map(g => (
              <button key={g.label} onClick={() => setGrid(g)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  grid.label === g.label ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}>
                {g.label}
              </button>
            ))}
            <span className="w-px h-6 bg-emerald-100 shrink-0" />
            <button onClick={printSheet} disabled={printing}
              className="rounded-full bg-emerald-600 text-white px-4 py-1.5 text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 flex items-center gap-2 whitespace-nowrap">
              <Icon name="printer" className="w-4 h-4" /> {printing ? "Preparing…" : "Print sheet"}
            </button>
            <button onClick={() => setSelected([])} title="Clear selection"
              className="rounded-full bg-stone-100 text-stone-600 w-8 h-8 grid place-items-center hover:bg-stone-200 transition shrink-0">
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <InventoryForm
          initial={edit}
          onClose={() => { setShowForm(false); setEdit(null); }}
          onSaved={() => { setShowForm(false); setEdit(null); load(); }}
        />
      )}
    </div>
  );
}