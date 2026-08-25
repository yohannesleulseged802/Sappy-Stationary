"use client";
import { useEffect, useState } from "react";
import SalesTicket from "@/components/modules/SalesTicket";
import SalesLedger from "@/components/modules/SalesLedger";
import KpiTile from "@/components/ui/KpiTile";
import Card from "@/components/ui/Card";
import { fmt, num } from "@/lib/money";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [reload, setReload] = useState(0);

  async function load() {
    const r = await fetch("/api/sales"); const j = await r.json(); setSales(j);
  }
  useEffect(() => { load(); }, [reload]);

  const today = new Date(); today.setHours(0,0,0,0);
  const todays = sales.filter(s => new Date(s.date) >= today);
  const todayTotal = todays.reduce((s, x) => s + (x.refunded ? 0 : num(x.total)), 0);

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl">Sales</h1>
          <p className="text-emerald-800/70">Record a ticket, scan, refund, and track.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiTile label="Today's sales" value={todays.length} />
        <KpiTile label="Today's total" value={fmt(todayTotal)} />
        <KpiTile label="All sales" value={sales.length} />
        <KpiTile label="Refunded" value={sales.filter(s => s.refunded).length} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="New ticket">
          <SalesTicket onDone={() => setReload(x => x + 1)} />
        </Card>
        <Card title="Sales ledger">
          <SalesLedger sales={sales} onChanged={() => setReload(x => x + 1)} />
        </Card>
      </div>
    </div>
  );
}