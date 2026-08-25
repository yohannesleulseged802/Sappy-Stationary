"use client";
import { useState } from "react";
import Modal from "../ui/Modal";
import { fmt, num } from "@/lib/money";
type Line = { itemName: string; qty: number; cost: number; itemId?: string };
export default function PurchaseForm({ initial, onClose, onSaved }: any) {
  const [supplier, setSupplier] = useState(initial?.supplier || "");
  const [date, setDate] = useState(initial?.date?.slice(0,10) || new Date().toISOString().slice(0,10));
  const [status, setStatus] = useState(initial?.status || "draft");
  const [lines, setLines] = useState<Line[]>(initial?.lines || []);

  function addLine() { setLines(ls => [...ls, { itemName: "", qty: 1, cost: 0 }]); }
  const total = lines.reduce((s, l) => s + l.qty * num(l.cost), 0);

  async function save() {
    const body = { id: initial?.id, supplier, date, status, lines, total };
    const r = await fetch("/api/purchases", {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (j.ok) onSaved(); else alert(j.error || "Failed");
  }

  return (
    <Modal open={true} onClose={onClose} title={initial ? "Edit PO" : "New PO"}>
      <div className="space-y-2">
        <input placeholder="Supplier" value={supplier} onChange={e=>setSupplier(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2" />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="rounded-xl border border-emerald-200 px-4 py-2" />
          <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-emerald-200 px-4 py-2">
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
          </select>
        </div>

        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input placeholder="Item" value={l.itemName} onChange={e => setLines(ls => ls.map((x,j)=>j===i?{...x,itemName:e.target.value}:x))}
                className="flex-1 rounded-lg border border-emerald-200 px-3 py-1.5" />
              <input type="number" value={l.qty} onChange={e => setLines(ls => ls.map((x,j)=>j===i?{...x,qty:Number(e.target.value)}:x))}
                className="w-16 rounded-lg border border-emerald-200 px-2 py-1.5 text-center" />
              <input type="number" step="0.01" value={l.cost} onChange={e => setLines(ls => ls.map((x,j)=>j===i?{...x,cost:Number(e.target.value)}:x))}
                className="w-24 rounded-lg border border-emerald-200 px-2 py-1.5 text-right" />
              <button onClick={() => setLines(ls => ls.filter((_,j)=>j!==i))} className="text-red-500">✕</button>
            </div>
          ))}
          <button onClick={addLine} className="text-sm text-emerald-700">+ Add line</button>
        </div>

        <div className="text-right font-display text-lg">Total: {fmt(total)}</div>

        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-emerald-200 py-2">Cancel</button>
          <button onClick={save} className="flex-1 rounded-xl bg-emerald-600 text-white py-2">Save</button>
        </div>
      </div>
    </Modal>
  );
}