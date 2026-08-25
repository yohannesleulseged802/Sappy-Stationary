"use client";
import { useState } from "react";
import Modal from "../ui/Modal";
export default function ExpenseForm({ categories, onClose, onSaved }: any) {
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  async function save() {
    const r = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, description: category === "Other" ? description : "", amount: Number(amount), date }),
    });
    const j = await r.json();
    if (j.ok) onSaved(); else alert(j.error || "Failed");
  }
  return (
    <Modal open={true} onClose={onClose} title="New expense">
      <div className="space-y-2">
        <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2">
          {categories.map((c:string) => <option key={c}>{c}</option>)}
        </select>
        {category === "Other" && (
          <input placeholder="Describe" value={description} onChange={e=>setDescription(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2" />
        )}
        <input type="number" step="0.01" placeholder="Amount (ETB)" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2" />
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2" />
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-emerald-200 py-2">Cancel</button>
          <button onClick={save} className="flex-1 rounded-xl bg-emerald-600 text-white py-2">Save</button>
        </div>
      </div>
    </Modal>
  );
}