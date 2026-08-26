"use client";
import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { fmt } from "@/lib/money";
import Icon from "../ui/Icon";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default function QrSheet({ items, onClose }: any) {
  const [size, setSize] = useState(3);
  const [selected, setSelected] = useState<string[]>(items.slice(0, 9).map((i: any) => i.id));
  const [dataUrls, setDataUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Record<string, string> = {};
      for (const id of selected) {
        try {
          const r = await fetch(`/api/inventory/${id}?qr=1`);
          const j = await r.json();
          out[id] = j.dataUrl;
        } catch { }
      }
      if (alive) setDataUrls(out);
    })();
    return () => { alive = false; };
  }, [selected]);

  const chosen = selected.map(id => items.find((i: any) => i.id === id)).filter(Boolean);
  const cells = Array.from({ length: size * size });

  function print() {
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) { alert("Please allow pop-ups to print the label sheet."); return; }
    const body = chosen.map(it => `
      <div class="cell">
        ${dataUrls[it.id] ? `<img class="qr" src="${dataUrls[it.id]}" />` : ""}
        <div class="name">${esc(it.name)}</div>
        <div class="serial">${it.serial}</div>
        <div class="price">${fmt(it.price)}</div>
      </div>`).join("");
    w.document.write(`<html><head><title>Sappy Stationary — Labels</title><style>
      @page { size: A4; margin: 10mm; }
      body { font-family: Arial, sans-serif; }
      header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
      header img { width: 30px; height: 30px; border-radius: 6px; }
      header b { font-size: 16px; color: #065F46; }
      .grid { display: grid; grid-template-columns: repeat(${size}, 1fr); gap: 4px; }
      .cell { border: 1.5px solid #059669; border-radius: 10px; padding: 6px; text-align: center;
              aspect-ratio: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; }
      .qr { width: 58%; }
      .name { font-weight: 700; font-size: 10px; margin-top: 2px; }
      .serial { font-size: 8px; color: #555; }
      .price { font-size: 12px; font-weight: 700; color: #059669; }
    </style></head><body>
      <header><img src="/logo.png" /><b>Sappy Stationary</b></header>
      <div class="grid">${body}</div>
      <script>window.onload = function(){ window.print(); }<\/script>
    </body></html>`);
    w.document.close();
  }

  return (
    <Modal open={true} onClose={onClose} title="Print A4 label sheet">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-sm">Grid:</span>
        {[2, 3, 4, 5, 6].map(n => (
          <button key={n} onClick={() => setSize(n)}
            className={`px-3 py-1 rounded-full text-sm ${size === n ? "bg-emerald-600 text-white" : "bg-white border border-emerald-200"}`}>
            {n}×{n}
          </button>
        ))}
        <button onClick={print}
          className="ml-auto rounded-xl bg-emerald-600 text-white px-4 py-2 flex items-center gap-2 hover:bg-emerald-700 transition">
          <Icon name="printer" className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 max-h-28 overflow-auto">
        {items.map((i: any) => (
          <label key={i.id}
            className={`text-xs rounded-full px-2 py-1 cursor-pointer ${selected.includes(i.id) ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-900"}`}>
            <input type="checkbox" className="hidden" checked={selected.includes(i.id)}
              onChange={() => setSelected(s => s.includes(i.id) ? s.filter(x => x !== i.id) : [...s, i.id])} />
            {i.name}
          </label>
        ))}
      </div>

      <div className="bg-white border border-emerald-200 rounded-xl p-2">
        <div className="flex items-center gap-2 mb-2">
          <img src="/logo.png" alt="logo" className="w-6 h-6 rounded-md object-cover bg-white" />
          <span className="font-display text-emerald-800">Sappy Stationary</span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {cells.map((_, idx) => {
            const it = chosen[idx];
            if (!it) return <div key={idx} className="border border-dashed border-emerald-200 rounded aspect-square" />;
            return (
              <div key={idx} className="border border-emerald-300 rounded p-1 flex flex-col items-center justify-center text-center aspect-square">
                {dataUrls[it.id] && <img src={dataUrls[it.id]} alt="qr" className="w-3/5 h-auto" />}
                <div className="text-[9px] font-semibold truncate w-full">{it.name}</div>
                <div className="text-[8px] text-emerald-900/60">{it.serial}</div>
                <div className="text-[10px] font-display text-emerald-700">{fmt(it.price)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}