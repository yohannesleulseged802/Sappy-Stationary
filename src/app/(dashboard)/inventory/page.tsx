"use client";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import Card from "@/components/ui/Card";
import KpiTile from "@/components/ui/KpiTile";
import Icon from "@/components/ui/Icon";
import { fmt, num } from "@/lib/money";
import { qrDataUrl } from "@/lib/qr";

/* ================= helpers ================= */
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
async function imgToDataUrl(src: string): Promise<string> {
  const img = await loadImg(src);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return c.toDataURL("image/png");
}

/* QR cache — generated once per item, then instant forever */
const qrCache: Record<string, string> = {};

/* ================= overlay (local modal) ================= */
function Overlay({ onClose, title, children }: any) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-5 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xl truncate pr-2">{title}</h3>
            <button onClick={onClose} className="text-emerald-700 hover:bg-emerald-50 rounded-lg w-8 h-8 grid place-items-center shrink-0">✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

const GRIDS = [
  { label: "2×2", c: 2, r: 2 },
  { label: "3×3", c: 3, r: 3 },
  { label: "4×4", c: 4, r: 4 },
  { label: "5×5", c: 5, r: 5 },
  { label: "6×6", c: 6, r: 6 },
  { label: "7×7", c: 7, r: 7 },
  { label: "8×8", c: 8, r: 8 },
  { label: "8×10", c: 8, r: 10 },
];

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [copies, setCopies] = useState<Record<string, number>>({});
  const [grid, setGrid] = useState(GRIDS[1]);
  const [printing, setPrinting] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [qr, setQr] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [del, setDel] = useState<any>(null);
  const [master, setMaster] = useState("");
  const [masterErr, setMasterErr] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/inventory");
      const j = await r.json();
      setItems(Array.isArray(j) ? j : []);
    } catch { setItems([]); }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!qr) { setQrUrl(""); return; }
    qrDataUrl(qr.serial).then(setQrUrl).catch(() => setQrUrl(""));
  }, [qr]);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(q.toLowerCase()) ||
    i.serial.toLowerCase().includes(q.toLowerCase()) ||
    i.category.toLowerCase().includes(q.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every(i => selected.includes(i.id));
  function toggleAll() {
    if (allSelected) setSelected([]);
    else setSelected(filtered.map(i => i.id));
  }

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

  function toggle(id: string) {
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  }
  function toggleCopies(id: string, qty: number) {
    setCopies(c => ({ ...c, [id]: (c[id] || 1) === 1 ? Math.max(qty, 1) : 1 }));
  }

  /* INSTANT: QR codes generated on-device + cached */
  async function buildEntries() {
    const entries: any[] = [];
    for (const id of selected) {
      const it = items.find(i => i.id === id);
      if (!it) continue;
      let url = qrCache[id];
      if (!url) {
        url = await qrDataUrl(it.serial);
        qrCache[id] = url;
      }
      const n = Math.max(copies[id] || 1, 1);
      for (let k = 0; k < n; k++) entries.push({ name: it.name, serial: it.serial, qr: url });
    }
    return entries;
  }

  /* ---------- PRINT ---------- */
  async function printSheet() {
    if (!selected.length) return;
    setPrinting(true);
    try {
      const entries = await buildEntries();
      const pages = chunk(entries, grid.c * grid.r);
      const w = window.open("", "_blank", "width=900,height=1200");
      if (!w) { alert("Please allow pop-ups to print the label sheet."); return; }
      const dense = grid.c * grid.r >= 40;
      const pagesHtml = pages.map(page => `
        <div class="page">
          <div class="grid ${dense ? "dense" : ""}" style="grid-template-columns: repeat(${grid.c}, 1fr); grid-template-rows: repeat(${grid.r}, 1fr);">
            ${page.map(cell => cell ? `
              <div class="cell">
                <img class="clogo" src="/logo.png" />
                ${cell.qr ? `<div class="qrwrap"><img class="qr" src="${cell.qr}" /></div>` : ""}
                <div class="name">${esc(cell.name)}</div>
                <div class="serial">${cell.serial}</div>
              </div>` : `<div class="cell empty"></div>`).join("")}
          </div>
        </div>`).join("");
      w.document.write(`<html><head><title>Sappy Stationary — Labels</title><style>
        @page { size: A4; margin: 8mm; } * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; margin: 0; }
        .page { height: 281mm; display: flex; flex-direction: column; page-break-after: always; }
        .page:last-child { page-break-after: auto; }
        .grid { flex: 1; display: grid; gap: 3px; }
        .cell { border: 1.2px solid #059669; border-radius: 8px; padding: 2px; text-align: center;
                display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden; }
        .cell.empty { border-style: dashed; border-color: #bbb; }
        .clogo { width: 20%; max-width: 26px; border-radius: 4px; background: #fff; margin-bottom: 1px; }
        .qrwrap { width: 60%; }
        .qrwrap .qr { width: 100%; display: block; }
        .name { font-weight: 700; font-size: 9px; line-height: 1.15; }
        .serial { font-size: 7px; color: #555; }
        .dense .clogo { width: 24%; max-width: none; margin-bottom: 0; }
        .dense .qrwrap { width: 74%; }
        .dense .name { font-size: 6.5px; }
        .dense .serial { font-size: 5.5px; }
        .dense .cell { border-radius: 4px; }
      </style></head><body>${pagesHtml}
      <script>window.onload = function(){ window.print(); }<\/script></body></html>`);
      w.document.close();
    } finally { setPrinting(false); }
  }

  /* ---------- EXPORT PDF ---------- */
  async function exportSheetPdf() {
    if (!selected.length) return;
    setPrinting(true);
    try {
      const entries = await buildEntries();
      const cols = grid.c, rows = grid.r;
      const pages = chunk(entries, cols * rows);

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210, pageH = 297, margin = 8, gap = 2;
      const gridW = pageW - margin * 2;
      const gridH = pageH - margin * 2 - 6;
      const cellW = (gridW - gap * (cols - 1)) / cols;
      const cellH = (gridH - gap * (rows - 1)) / rows;
      const dense = cols * rows >= 40;

      let logoData = "";
      try { logoData = await imgToDataUrl("/logo.png"); } catch { logoData = ""; }

      for (let p = 0; p < pages.length; p++) {
        if (p > 0) doc.addPage();

        const pageItems = pages[p];
        for (let idx = 0; idx < cols * rows; idx++) {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const x = margin + col * (cellW + gap);
          const y = margin + row * (cellH + gap);
          const cell = pageItems[idx];

          doc.setDrawColor(5, 150, 105);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, y, cellW, cellH, 1.5, 1.5);
          if (!cell) continue;

          let cy = y + 1.2;
          if (logoData) {
            const ls = Math.min(cellW * 0.3, cellH * 0.18, 10);
            try { doc.addImage(logoData, "PNG", x + (cellW - ls) / 2, cy, ls, ls); } catch { }
            cy += ls + 0.8;
          }
          if (cell.qr) {
            const s = Math.min(cellW * 0.62, cellH * 0.55);
            try { doc.addImage(cell.qr, "PNG", x + (cellW - s) / 2, cy, s, s); } catch { }
            cy += s + 0.8;
          }
          doc.setTextColor(31, 42, 36);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(dense ? 5 : 7);
          const nameLine = (doc.splitTextToSize(cell.name, cellW - 2)[0] || "") as string;
          doc.text(nameLine, x + cellW / 2, cy + 2, { align: "center" });
          doc.setFont("helvetica", "normal");
          doc.setFontSize(dense ? 4 : 5.5);
          doc.setTextColor(130, 130, 130);
          doc.text(cell.serial, x + cellW / 2, cy + (dense ? 4.2 : 5), { align: "center" });
        }

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`© ${new Date().getFullYear()} Sappy Stationary`, margin, pageH - 4);
        doc.text(`Page ${p + 1} of ${pages.length}`, pageW - margin, pageH - 4, { align: "right" });
      }

      doc.save("sappy-label-sheet.pdf");
    } finally { setPrinting(false); }
  }

  /* ---------- single label PNG ---------- */
  async function downloadLabelPng(item: any) {
    if (!qrUrl) return;
    const qrI = await loadImg(qrUrl);
    let logo: HTMLImageElement | null = null;
    try { logo = await loadImg("/logo.png"); } catch { logo = null; }
    const W = 640, H = 900;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d")!;
    x.fillStyle = "#FBF7EE"; x.fillRect(0, 0, W, H);
    x.strokeStyle = "#059669"; x.lineWidth = 10; x.strokeRect(15, 15, W - 30, H - 30);
    x.fillStyle = "#FFFFFF"; x.fillRect(35, 35, W - 70, H - 70);
    let y = 70;
    if (logo) { x.drawImage(logo, (W - 110) / 2, y, 110, 110); y += 130; }
    x.textAlign = "center";
    x.fillStyle = "#065F46"; x.font = "bold 44px Georgia, serif"; x.fillText("Sappy Stationary", W / 2, y + 30); y += 75;
    x.fillStyle = "#1F2A24"; x.font = "bold 38px Arial";
    x.fillText(item.name.length > 22 ? item.name.slice(0, 21) + "…" : item.name, W / 2, y + 5); y += 45;
    x.fillStyle = "#6B7280"; x.font = "26px Arial"; x.fillText(item.serial, W / 2, y + 5); y += 45;
    const qs = 420;
    x.drawImage(qrI, (W - qs) / 2, y, qs, qs);
    x.fillStyle = "#9CA3AF"; x.font = "24px Arial"; x.fillText("sappyshop.site", W / 2, H - 55);
    const a = document.createElement("a"); a.download = `${item.serial}-label.png`; a.href = c.toDataURL("image/png"); a.click();
  }

  async function confirmDelete() {
    const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ masterCode: master }) });
    const j = await r.json();
    if (!j.ok) { setMasterErr("Incorrect master code"); return; }
    await fetch(`/api/inventory/${del.id}`, { method: "DELETE" });
    setDel(null); setMaster(""); setMasterErr("");
    load();
  }

  function copiesButton(i: any) {
    const active = (copies[i.id] || 1) > 1;
    return (
      <button onClick={() => toggleCopies(i.id, i.quantity)}
        title={active ? `Will print ${i.quantity} labels (press for 1)` : "Print one label per unit in stock"}
        className={`text-xs rounded-full px-3 py-1 font-semibold transition ${active ? "bg-emerald-600 text-white" : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>
        x{active ? i.quantity : 1}
      </button>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Inventory</h1>
          <p className="text-emerald-900/60">Your stock, organized and scannable.</p>
        </div>
        <button onClick={() => { setEdit(null); setFormOpen(true); }}
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
          <button onClick={toggleAll}
            className={`rounded-xl px-4 py-2 font-semibold transition flex items-center gap-2 ${
              allSelected ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-emerald-200 bg-white hover:bg-emerald-50"
            }`}>
            <Icon name={allSelected ? "x" : "check"} className="w-4 h-4" />
            {allSelected ? "Clear all" : "Select all"}
          </button>
          <button onClick={() => download("/api/inventory?export=template", "sappy-import-template.xlsx")}
            className="rounded-xl border border-emerald-200 bg-white px-4 py-2 hover:bg-emerald-50 transition flex items-center gap-2">
            <Icon name="download" className="w-4 h-4" /> <span className="hidden sm:inline">Template</span>
          </button>
          <label className="rounded-xl border border-emerald-200 bg-white px-4 py-2 cursor-pointer hover:bg-emerald-50 transition flex items-center gap-2">
            <Icon name="upload" className="w-4 h-4" /> <span className="hidden sm:inline">Import</span>
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
            <Icon name="download" className="w-4 h-4" /> <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={() => download("/api/inventory?export=pdf", "inventory.pdf")}
            className="rounded-xl border border-emerald-200 bg-white px-4 py-2 hover:bg-emerald-50 transition flex items-center gap-2">
            <Icon name="download" className="w-4 h-4" /> <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
        <p className="text-xs text-emerald-900/50 mb-3">
          Labels: <b>Select all</b> (or tick items) → pick a grid (2×2 … 8×10) → press <b>x1</b> for one label per unit (<b>xQTY</b>) → <b>Print</b> or <b>PDF</b>.
        </p>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-emerald-900/50 text-xs uppercase tracking-wide">
              <tr>
                <th className="py-2 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} title="Select all" />
                </th>
                <th className="py-2">Name</th>
                <th className="py-2">Serial</th>
                <th className="py-2">Category</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Cost</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {filtered.map((i: any) => (
                <tr key={i.id} className="hover:bg-emerald-50/50">
                  <td><input type="checkbox" checked={selected.includes(i.id)} onChange={() => toggle(i.id)} /></td>
                  <td className="py-2 font-medium">{i.name}</td>
                  <td className="py-2 text-emerald-900/60">{i.serial}</td>
                  <td className="py-2">{i.category}</td>
                  <td className="py-2 text-right font-display">{i.quantity}</td>
                  <td className="py-2 text-right">{i.costUnknown || i.cost === null ? <span className="text-xs text-amber-600">unknown</span> : fmt(i.cost)}</td>
                  <td className="py-2 text-right font-medium">{fmt(i.price)}</td>
                  <td className="py-2 text-right space-x-2 whitespace-nowrap">
                    {copiesButton(i)}
                    <button onClick={() => setQr(i)} className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 hover:bg-emerald-100 transition">QR</button>
                    <button onClick={() => { setEdit(i); setFormOpen(true); }} className="text-xs rounded-full bg-stone-100 text-stone-700 px-3 py-1 hover:bg-stone-200 transition">Edit</button>
                    <button onClick={() => setDel(i)} className="text-xs rounded-full bg-red-50 text-red-600 px-3 py-1 hover:bg-red-100 transition">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-emerald-900/50">No items found.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {filtered.map((i: any) => (
            <div key={i.id} className="bg-white rounded-xl border border-emerald-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <input type="checkbox" className="mt-1" checked={selected.includes(i.id)} onChange={() => toggle(i.id)} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.name}</div>
                    <div className="text-xs text-emerald-900/50 truncate">{i.serial} • {i.category}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-lg">{i.quantity}</div>
                  <div className="text-xs">{fmt(i.price)}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {copiesButton(i)}
                <button onClick={() => setQr(i)} className="flex-1 text-xs rounded-full bg-emerald-50 text-emerald-700 py-1">QR</button>
                <button onClick={() => { setEdit(i); setFormOpen(true); }} className="flex-1 text-xs rounded-full bg-stone-100 py-1">Edit</button>
                <button onClick={() => setDel(i)} className="flex-1 text-xs rounded-full bg-red-50 text-red-600 py-1">Delete</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="py-8 text-center text-emerald-900/50">No items found.</p>}
        </div>
      </Card>

      {/* Bottom label bar */}
      {selected.length > 0 && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 z-40">
          <div className="flex items-center gap-2 rounded-2xl md:rounded-full border border-emerald-100 bg-white/95 backdrop-blur shadow-soft px-3 py-2 max-w-[95vw] overflow-x-auto no-scrollbar">
            <span className="text-sm font-semibold text-emerald-900 whitespace-nowrap">{selected.length} selected</span>
            <span className="w-px h-6 bg-emerald-100 shrink-0" />
            {GRIDS.map(g => (
              <button key={g.label} onClick={() => setGrid(g)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${grid.label === g.label ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}>
                {g.label}
              </button>
            ))}
            <span className="w-px h-6 bg-emerald-100 shrink-0" />
            <button onClick={printSheet} disabled={printing}
              className="rounded-full bg-emerald-600 text-white px-4 py-1.5 text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 flex items-center gap-2 whitespace-nowrap">
              <Icon name="printer" className="w-4 h-4" /> {printing ? "Working…" : "Print"}
            </button>
            <button onClick={exportSheetPdf} disabled={printing}
              className="rounded-full border border-emerald-600 bg-white text-emerald-700 px-4 py-1.5 text-sm font-semibold hover:bg-emerald-50 transition disabled:opacity-60 flex items-center gap-2 whitespace-nowrap">
              <Icon name="download" className="w-4 h-4" /> {printing ? "Working…" : "PDF"}
            </button>
            <button onClick={() => setSelected([])} title="Clear selection"
              className="rounded-full bg-stone-100 text-stone-600 w-8 h-8 grid place-items-center hover:bg-stone-200 transition shrink-0">
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit form (with duplicate warning) */}
      {formOpen && (
        <ItemForm initial={edit} onClose={() => { setFormOpen(false); setEdit(null); }} onSaved={() => { setFormOpen(false); setEdit(null); load(); }} />
      )}

      {/* QR label */}
      {qr && (
        <Overlay onClose={() => setQr(null)} title={qr.name}>
          <div className="text-center">
            <div className="mx-auto w-60 md:w-64 rounded-2xl overflow-hidden border-2 border-emerald-600 bg-white shadow-soft">
              <div className="bg-emerald-600 py-1.5 flex items-center justify-center gap-2">
                <img src="/logo.png" alt="logo" className="w-5 h-5 rounded-md object-cover bg-white" />
                <span className="text-white font-display text-base">Sappy Stationary</span>
              </div>
              <div className="p-3 bg-cream">
                <div className="font-semibold text-sm truncate">{qr.name}</div>
                <div className="text-[11px] text-emerald-900/60 mt-0.5">{qr.serial}</div>
                <div className="my-2 bg-white p-2 rounded-xl border border-emerald-100">
                  {qrUrl ? <img src={qrUrl} alt="QR" className="w-full h-auto" /> : <div className="h-32 grid place-items-center text-emerald-900/40 text-xs">Loading…</div>}
                </div>
                <div className="text-[9px] text-emerald-900/50 mt-0.5">sappyshop.site</div>
              </div>
            </div>
            <div className="flex gap-2 justify-center mt-3">
              <button onClick={() => downloadLabelPng(qr)}
                className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm flex items-center gap-2 hover:bg-emerald-700 transition">
                <Icon name="download" className="w-4 h-4" /> Label PNG
              </button>
              <button onClick={() => { const a = document.createElement("a"); a.href = qrUrl; a.download = `${qr.serial}.png`; a.click(); }}
                className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm flex items-center gap-2 hover:bg-emerald-50 transition">
                <Icon name="qr" className="w-4 h-4" /> QR only
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Delete with master code */}
      {del && (
        <Overlay onClose={() => { setDel(null); setMaster(""); setMasterErr(""); }} title={`Delete ${del.name}?`}>
          <p className="text-sm text-emerald-900/60">Enter the master code to confirm deletion.</p>
          <input type="password" value={master} onChange={e => setMaster(e.target.value)} placeholder="Master code"
            className="mt-3 w-full rounded-xl border border-emerald-200 px-4 py-2" />
          {masterErr && <p className="text-sm text-red-600 mt-2">{masterErr}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setDel(null); setMaster(""); setMasterErr(""); }} className="flex-1 rounded-xl border border-emerald-200 py-2">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 rounded-xl bg-red-500 text-white py-2 hover:bg-red-600 transition">Delete</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

/* ================= inline item form ================= */
function ItemForm({ initial, onClose, onSaved }: any) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "Custom");
  const [quantity, setQuantity] = useState(initial?.quantity ?? 0);
  const [location, setLocation] = useState(initial?.location || "");
  const [cost, setCost] = useState(initial?.cost?.toString() || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [costUnknown, setCostUnknown] = useState(!!initial?.costUnknown);
  const [err, setErr] = useState("");

  const [allNames, setAllNames] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/inventory").then(r => r.json())
      .then(j => setAllNames((Array.isArray(j) ? j : []).map((x: any) => ({ id: x.id, name: String(x.name).toLowerCase() }))))
      .catch(() => {});
  }, []);
  const dup = allNames.find(n => n.name === name.trim().toLowerCase() && n.id !== initial?.id);

  async function save() {
    if (!name) return setErr("Name is required");
    const body = {
      id: initial?.id,
      name, category,
      quantity: Number(quantity),
      location,
      cost: costUnknown ? null : (cost === "" ? null : Number(cost)),
      price: Number(price) || 0,
      costUnknown,
    };
    const r = await fetch("/api/inventory", {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (j.ok) onSaved(); else setErr(j.error || "Failed to save");
  }

  return (
    <Overlay onClose={onClose} title={initial ? "Edit item" : "New item"}>
      <div className="space-y-2">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2" />
        {dup && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            ⚠️ An item named “{name.trim()}” already exists — saving will create a duplicate.
          </div>
        )}
        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2">
          <option>Custom</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} className="rounded-xl border border-emerald-200 px-4 py-2" />
          <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} className="rounded-xl border border-emerald-200 px-4 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={costUnknown} onChange={e => setCostUnknown(e.target.checked)} />
          Cost unknown
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" step="0.01" placeholder="Cost (ETB)" disabled={costUnknown} value={cost} onChange={e => setCost(e.target.value)} className="rounded-xl border border-emerald-200 px-4 py-2 disabled:bg-stone-50" />
          <input type="number" step="0.01" placeholder="Sell price (ETB)" value={price} onChange={e => setPrice(e.target.value)} className="rounded-xl border border-emerald-200 px-4 py-2" />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-emerald-200 py-2">Cancel</button>
          <button onClick={save} className="flex-1 rounded-xl bg-emerald-600 text-white py-2 hover:bg-emerald-700 transition">Save</button>
        </div>
      </div>
    </Overlay>
  );
}