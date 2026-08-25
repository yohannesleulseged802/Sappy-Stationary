"use client";
import { useState } from "react";
import Modal from "../ui/Modal";
import { fmt } from "@/lib/money";
export default function QrSheet({ items, onClose }: any) {
  const [size, setSize] = useState(3);
  const [selected, setSelected] = useState<string[]>(items.slice(0, size*size).map((i:any)=>i.id));
  const [dataUrls, setDataUrls] = useState<Record<string,string>>({});

  async function loadQrs() {
    const out: Record<string,string> = {};
    for (const id of selected) {
      const r = await fetch(`/api/inventory/${id}?qr=1`);
      const j = await r.json();
      out[id] = j.dataUrl;
    }
    setDataUrls(out);
  }
  useState(() => { loadQrs(); });

  function print() { window.print(); }

  const cells = Array.from({ length: size*size });
  const chosen = selected.map(id => items.find((i:any)=>i.id===id)).filter(Boolean);

  return (
    <Modal open={true} onClose={onClose} title="Print A4 label sheet">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-sm">Grid:</span>
        {[2,3,4,5,6].map(n => (
          <button key={n} onClick={() => setSize(n)}
            className={`px-3 py-1 rounded-full text-sm ${size===n ? "bg-emerald-600 text-white" : "bg-white border border-emerald-200"}`}>{n}×{n}</button>
        ))}
        <button onClick={print} className="ml-auto rounded-xl bg-emerald-600 text-white px-4 py-2">Print</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {items.map((i:any) => (
          <label key={i.id} className={`text-xs rounded-full px-2 py-1 cursor-pointer ${selected.includes(i.id) ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800"}`}>
            <input type="checkbox" className="hidden" checked={selected.includes(i.id)}
              onChange={() => setSelected(s => s.includes(i.id) ? s.filter(x=>x!==i.id) : [...s, i.id])} />
            {i.name}
          </label>
        ))}
      </div>

      <div className="bg-white border border-emerald-200 rounded-xl p-2 aspect-[1/1.414]" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        <div className="grid h-full gap-1" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {cells.map((_, idx) => {
            const it = chosen[idx];
            if (!it) return <div key={idx} className="border border-dashed border-emerald-200 rounded" />;
            return (
              <div key={idx} className="border border-emerald-300 rounded p-1 flex flex-col items-center justify-center text-center">
                {dataUrls[it.id] && <img src={dataUrls[it.id]} className="w-3/5 h-auto" />}
                <div className="text-[9px] font-semibold truncate w-full">{it.name}</div>
                <div className="text-[8px] text-emerald-800/60">{it.serial}</div>
                <div className="text-[10px] font-display">{fmt(it.price)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}