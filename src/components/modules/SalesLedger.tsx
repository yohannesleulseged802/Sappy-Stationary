"use client";
import { useState } from "react";
import { fmt, num } from "@/lib/money";
import { toLocalDate, toLocalTime } from "@/lib/utils";
import MasterGate from "../ui/MasterGate";
import EmptyState from "../ui/EmptyState";

export default function SalesLedger({ sales, onChanged }: any) {
  const [refund, setRefund] = useState<any>(null);
  const [del, setDel] = useState<any>(null);

  async function doRefund() {
    await fetch(`/api/sales/${refund.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refunded: true }) });
    setRefund(null); onChanged();
  }
  async function doDel() {
    await fetch(`/api/sales/${del.id}`, { method: "DELETE" });
    setDel(null); onChanged();
  }

  return (
    <>
      <div className="divide-y divide-emerald-100 max-h-[60vh] overflow-auto">
        {sales.length === 0 && <EmptyState title="No sales yet." hint="Sales will appear here once you make a sale." />}
        {sales.map((s: any) => (
          <div key={s.id} className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{s.invoiceNo} {s.backdated && <span className="ml-1 text-xs rounded-full bg-amber-100 text-amber-700 px-2">Backdated</span>} {s.refunded && <span className="ml-1 text-xs rounded-full bg-red-100 text-red-700 px-2">Refunded</span>}</div>
                <div className="text-xs text-emerald-800/60">{toLocalDate(s.date)} {toLocalTime(s.date)} • {s.paymentMethod} • by {s.userName}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg">{fmt(s.total)}</div>
                <div className="text-xs text-emerald-800/60">{s.lines?.length || 0} items</div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {!s.refunded && <button onClick={() => setRefund(s)} className="text-xs rounded-full bg-amber-50 text-amber-700 px-3 py-1">Refund</button>}
              <button onClick={() => setDel(s)} className="text-xs rounded-full bg-red-50 text-red-600 px-3 py-1">Delete</button>
            </div>
          </div>
        ))}
      </div>
      {refund && <MasterGate title="Refund sale?" onOk={doRefund} onCancel={() => setRefund(null)} />}
      {del && <MasterGate title="Delete sale?" onOk={doDel} onCancel={() => setDel(null)} />}
    </>
  );
}