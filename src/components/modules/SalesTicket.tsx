"use client";
import { useEffect, useState } from "react";
import { fmt, num } from "@/lib/money";
import QrScanner from "./QrScanner";
import Icon from "../ui/Icon";

const PAYMENTS = ["Telebirr", "CBE (Yohannes)", "CBE (Azeb)", "Awash", "Abyssinia"];

type Line = { itemId?: string; name: string; qty: number; price: number };

function localTodayStr() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function SalesTicket({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState(PAYMENTS[0]);
  const [date, setDate] = useState(localTodayStr());
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/inventory").then(r => r.json()).then(setItems).catch(() => setItems([]));
  }, []);

  const q = query.trim().toLowerCase();
  const matches = q
    ? items.filter(i => i.name.toLowerCase().includes(q) || i.serial.toLowerCase().includes(q)).slice(0, 6)
    : [];

  function addLine(i: any) {
    setLines(ls => {
      const ex = ls.find(l => l.itemId === i.id);
      if (ex) return ls.map(l => (l.itemId === i.id ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { itemId: i.id, name: i.name, qty: 1, price: num(i.price) }];
    });
    setQuery("");
  }

  function addCustom() {
    const name = query.trim();
    if (!name) return;
    setLines(ls => [...ls, { name, qty: 1, price: 0 }]);
    setQuery("");
  }

  function onScan(code: string) {
    const it = items.find(i => i.serial === code);
    if (it) addLine(it);
    setScanning(false);
  }

  function setLine(idx: number, patch: Partial<Line>) {
    setLines(ls => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const total = Math.max(0, subtotal - (discount || 0));
  const backdated = date < localTodayStr();

  async function record() {
    if (lines.length === 0 || saving) return;
    setSaving(true);
    try {
      const r = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, discount: discount || 0, paymentMethod: payment, date }),
      });
      const j = await r.json();
      if (j.ok) {
        setLines([]);
        setDiscount(0);
        onDone();
      } else {
        alert(j.error || "Could not record the sale.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Item picker */}
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900/40">
            <Icon name="search" className="w-4 h-4" />
          </span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder="Search stock or type item…"
            className="w-full rounded-xl border border-emerald-200 bg-white pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button onClick={() => setScanning(true)} title="Scan QR"
          className="rounded-xl bg-emerald-50 text-emerald-700 px-3 hover:bg-emerald-100 transition grid place-items-center shrink-0">
          <Icon name="camera" className="w-5 h-5" />
        </button>
        <button onClick={addCustom}
          className="rounded-xl bg-emerald-600 text-white px-4 py-2.5 font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 shrink-0">
          <Icon name="plus" className="w-4 h-4" /> <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {q !== "" && (
        <div className="mt-2 rounded-xl border border-emerald-100 bg-white divide-y divide-emerald-50 overflow-hidden">
          {matches.map(m => (
            <button key={m.id} onClick={() => addLine(m)}
              className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 active:bg-emerald-50 flex items-center justify-between gap-2 min-w-0">
              <span className="font-medium truncate">{m.name}</span>
              <span className="text-xs text-emerald-900/50 shrink-0">{m.quantity} left • {fmt(m.price)}</span>
            </button>
          ))}
          {matches.length === 0 && (
            <div className="px-3 py-2 text-sm text-emerald-900/50">
              No stock match — press <b>Add</b> to use “{query.trim()}” as a custom item.
            </div>
          )}
        </div>
      )}

      {/* Ticket lines — stacked for thumbs */}
      <div className="mt-4 space-y-2">
        {lines.map((l, idx) => (
          <div key={idx} className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-2">
            <div className="flex items-center gap-2">
              <input value={l.name} onChange={e => setLine(idx, { name: e.target.value })}
                className="flex-1 min-w-0 rounded-lg border border-emerald-200 bg-white px-3 py-2" />
              <button onClick={() => setLines(ls => ls.filter((_, i) => i !== idx))}
                className="text-red-400 hover:text-red-600 active:bg-red-50 grid place-items-center w-10 h-10 rounded-lg shrink-0"
                title="Remove line">
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 items-end">
              <div className="min-w-0">
                <label className="text-[10px] uppercase tracking-wide text-emerald-900/50 font-semibold">Qty</label>
                <input type="number" min={1} value={l.qty}
                  onChange={e => setLine(idx, { qty: Math.max(1, Number(e.target.value)) })}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-2 text-center" />
              </div>
              <div className="min-w-0">
                <label className="text-[10px] uppercase tracking-wide text-emerald-900/50 font-semibold">Price</label>
                <input type="number" step="0.01" min={0} value={l.price}
                  onChange={e => setLine(idx, { price: Number(e.target.value) })}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-2 text-right" />
              </div>
              <div className="min-w-0">
                <label className="text-[10px] uppercase tracking-wide text-emerald-900/50 font-semibold">Total</label>
                <div className="rounded-lg bg-white border border-emerald-100 px-2 py-2 text-right font-display truncate" title={fmt(l.qty * l.price)}>
                  {fmt(l.qty * l.price)}
                </div>
              </div>
            </div>
          </div>
        ))}
        {lines.length === 0 && (
          <div className="rounded-xl border border-dashed border-emerald-200 py-6 text-center text-sm text-emerald-900/50">
            No items yet — search, scan, or type a name above.
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="min-w-0">
          <label className="text-xs font-medium text-emerald-900/60">Discount (ETB)</label>
          <input type="number" step="0.01" min={0} value={discount}
            onChange={e => setDiscount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2" />
        </div>
        <div className="min-w-0">
          <label className="text-xs font-medium text-emerald-900/60">Payment</label>
          <select value={payment} onChange={e => setPayment(e.target.value)}
            className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2">
            {PAYMENTS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="min-w-0">
          <label className="text-xs font-medium text-emerald-900/60">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2" />
        </div>
        <div className="flex items-end min-w-0">
          <div className="w-full rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-right min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-emerald-900/50 font-semibold">Total</div>
            <div className="font-display text-xl truncate">{fmt(total)}</div>
          </div>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        {backdated ? (
          <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2.5 py-1 font-medium">Backdated</span>
        ) : (
          <span className="text-xs text-emerald-900/40">Totals update live.</span>
        )}
        <button onClick={record} disabled={lines.length === 0 || saving}
          className="rounded-xl bg-emerald-600 text-white px-5 py-2.5 font-semibold hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-50 flex items-center gap-2">
          <Icon name="check" className="w-4 h-4" />
          {saving ? "Recording…" : "Record sale"}
        </button>
      </div>

      {scanning && <QrScanner onScan={onScan} onClose={() => setScanning(false)} />}
    </div>
  );
}