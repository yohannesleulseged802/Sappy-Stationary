"use client";
import { useState } from "react";
import Modal from "../ui/Modal";
export default function CreditForm({ onClose, onSaved }: any) {
  const [customer, setCustomer] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  async function save() {
    const r = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer, item, amount: Number(amount), date }),
    });
    const j = await r.json();
    if (j.ok) onSaved(); else alert(j.error || "Failed");
  }
  return (
    <Modal open={true} onClose={onClose} title="New credit">
      <div className="space-y-2">
        <input placeholder="Customer name" value={customer} onChange={e=>setCustomer(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2" />
        <input placeholder="Item / description" value={item} onChange={e=>setItem(e.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2" />
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