"use client";
import { useEffect, useState } from "react";
import KpiTile from "@/components/ui/KpiTile";
import Card from "@/components/ui/Card";
import { fmt, num } from "@/lib/money";
import { toLocalDate } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports?view=dashboard").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-center py-20 text-emerald-700">Loading dashboard…</div>;

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Good day, Yohannes 👋</h1>
          <p className="text-emerald-800/70">Here's your shop at a glance.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile label="Items" value={data.items} />
        <KpiTile label="Units in stock" value={data.units} />
        <KpiTile label="Stock value" value={fmt(data.stockValue)} />
        <KpiTile label="Unknown cost" value={data.unknownCost} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Card title="Low stock">
          {data.lowStock?.length ? data.lowStock.map((i: any) => (
            <div key={i.id} className="flex justify-between py-2 border-b border-emerald-100 last:border-0">
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-xs text-emerald-800/60">{i.category} • by {i.userName}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg text-amber-600">{i.quantity}</div>
                <div className="text-xs text-emerald-800/60">units</div>
              </div>
            </div>
          )) : <p className="text-sm text-emerald-800/60">All good — nothing low.</p>}
        </Card>

        <Card title="Recent activity">
          {data.activity?.length ? data.activity.slice(0, 8).map((a: any) => (
            <div key={a.id} className="flex justify-between py-2 border-b border-emerald-100 last:border-0">
              <div>
                <div className="font-medium">{a.action.replace("_", " ")}</div>
                <div className="text-xs text-emerald-800/60">{a.details} • by {a.userName}</div>
              </div>
              <div className="text-xs text-emerald-800/60">{toLocalDate(a.createdAt)}</div>
            </div>
          )) : <p className="text-sm text-emerald-800/60">No activity yet.</p>}
        </Card>
      </div>
    </div>
  );
}