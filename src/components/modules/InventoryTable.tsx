"use client";
import { useState } from "react";
import { fmt, num } from "@/lib/money";
import { toLocalDate } from "@/lib/utils";
import QrLabel from "./QrLabel";
import MasterGate from "../ui/MasterGate";
import Modal from "../ui/Modal";

export default function InventoryTable({ items, selected, setSelected, onEdit, onDeleted }: any) {
  const [qr, setQr] = useState<any>(null);
  const [del, setDel] = useState<any>(null);

  function toggle(id: string) {
    setSelected((s: string[]) => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function delItem() {
    await fetch(`/api/inventory/${del.id}`, { method: "DELETE" });
    setDel(null); onDeleted();
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-emerald-800/60 text-xs uppercase">
            <tr>
              <th className="py-2 w-8"></th>
              <th className="py-2">Name</th>
              <th className="py-2">Serial</th>
              <th className="py-2">Category</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Cost</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2">By</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100">
            {items.map((i: any) => (
              <tr key={i.id} className="hover:bg-emerald-50/50">
                <td><input type="checkbox" checked={selected.includes(i.id)} onChange={() => toggle(i.id)} /></td>
                <td className="py-2 font-medium">{i.name}</td>
                <td className="py-2 text-emerald-800/70">{i.serial}</td>
                <td className="py-2">{i.category}</td>
                <td className="py-2 text-right font-display">{i.quantity}</td>
                <td className="py-2 text-right">{i.costUnknown ? <span className="text-xs text-amber-600">unknown</span> : fmt(i.cost)}</td>
                <td className="py-2 text-right">{fmt(i.price)}</td>
                <td className="py-2 text-xs text-emerald-800/60">by {i.userName}</td>
                <td className="py-2 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => setQr(i)} className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">QR</button>
                  <button onClick={() => onEdit(i)} className="text-xs rounded-full bg-stone-100 px-3 py-1">Edit</button>
                  <button onClick={() => setDel(i)} className="text-xs rounded-full bg-red-50 text-red-600 px-3 py-1">Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-emerald-800/60">No items yet. Add your first one.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {items.map((i: any) => (
          <div key={i.id} className="bg-white rounded-xl border border-emerald-100 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{i.name}</div>
                <div className="text-xs text-emerald-800/60 truncate">{i.serial} • {i.category} • by {i.userName}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg">{i.quantity}</div>
                <div className="text-xs">{fmt(i.price)}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setQr(i)} className="flex-1 text-xs rounded-full bg-emerald-50 text-emerald-700 py-1">QR</button>
              <button onClick={() => onEdit(i)} className="flex-1 text-xs rounded-full bg-stone-100 py-1">Edit</button>
              <button onClick={() => setDel(i)} className="flex-1 text-xs rounded-full bg-red-50 text-red-600 py-1">Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="py-8 text-center text-emerald-800/60">No items yet.</p>}
      </div>

      {qr && (
        <Modal open={true} onClose={() => setQr(null)} title={qr.name}>
          <QrLabel item={qr} />
        </Modal>
      )}

      {del && (
        <MasterGate title={`Delete ${del.name}?`} onOk={delItem} onCancel={() => setDel(null)} />
      )}
    </>
  );
}