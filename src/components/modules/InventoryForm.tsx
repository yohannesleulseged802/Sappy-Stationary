"use client";
import { useState } from "react";
import Modal from "../ui/Modal";
const CATS = ["Custom"];
export default function InventoryForm({ initial, onClose, onSaved }: any) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || CATS[0]);
  const [quantity, setQuantity] = useState(initial?.quantity ?? 0);
  const [location, setLocation] = useState(initial?.location || "");
  const [cost, setCost] = useState(initial?.cost?.toString() || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [costUnknown, setCostUnknown] = useState(!!initial?.costUnknown);
  const [err, setErr] = useState("");

  async function save() {
    if (!name) return setErr("Name required");
    const body = {
      id: initial?.id,
      name, category, quantity: Number(quantity), location,
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
    if (j.ok) onSaved(); else setErr(j.error || "Failed");
  }

  return (
    <Modal open={true} onClose={onClose} title={initial ? "Edit item" : "New item"}>
      <div className="space-y-2">
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2" />
        <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2">
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Quantity" value={quantity} onChange={e=>setQuantity(e.target.value)} className="rounded-xl border border-emerald-200 px-4 py-2" />
          <input placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} className="rounded-xl border border-emerald-200 px-4 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={costUnknown} onChange={e=>setCostUnknown(e.target.checked)} />
          Cost unknown
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" step="0.01" placeholder="Cost (ETB)" disabled={costUnknown} value={cost} onChange={e=>setCost(e.target.value)} className="rounded-xl border border-emerald-200 px-4 py-2 disabled:bg-stone-50" />
          <input type="number" step="0.01" placeholder="Sell price (ETB)" value={price} onChange={e=>setPrice(e.target.value)} className="rounded-xl border border-emerald-200 px-4 py-2" />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-emerald-200 py-2">Cancel</button>
          <button onClick={save} className="flex-1 rounded-xl bg-emerald-600 text-white py-2">Save</button>
        </div>
      </div>
    </Modal>
  );
}