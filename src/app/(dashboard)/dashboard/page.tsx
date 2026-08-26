"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import KpiTile from "@/components/ui/KpiTile";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { fmt } from "@/lib/money";
import { toLocalDate } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports?view=dashboard").then(r => r.json()).then(setData);
  }, []);

  const firstName = ((session?.user as any)?.name || "Owner").split(" ")[0];

  if (!data) {
    return <div className="text-center py-20 text-emerald-700">Loading dashboard…</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl">Good day, {firstName} 👋</h1>
        <p className="text-emerald-900/60">Here's your shop at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile label="Items" value={data.items} icon="box" />
        <KpiTile label="Units in stock" value={data.units} icon="chart" />
        <KpiTile label="Stock value (sell)" value={fmt(data.stockValue)} icon="cash" />
        <KpiTile label="Unknown cost" value={data.unknownCost} icon="alert" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Card title="Low stock">
          {data.lowStock?.length ? (
            <div className="divide-y divide-emerald-100">
              {data.lowStock.map((i: any) => (
                <div key={i.id} className="flex justify-between py-2 gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.name}</div>
                    <div className="text-xs text-emerald-900/50">{i.category} • by {i.userName}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-display text-lg ${i.quantity === 0 ? "text-red-600" : "text-amber-600"}`}>
                      {i.quantity}
                    </div>
                    <div className="text-xs text-emerald-900/50">{i.quantity === 0 ? "out" : "left"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="check" title="All stocked up" hint="Nothing is running low right now." />
          )}
        </Card>

        <Card title="Recent activity">
          {data.activity?.length ? (
            <div className="divide-y divide-emerald-100">
              {data.activity.slice(0, 8).map((a: any) => (
                <div key={a.id} className="flex justify-between py-2 gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.action.replace(/_/g, " ")}</div>
                    <div className="text-xs text-emerald-900/50 truncate">{a.details} • by {a.userName}</div>
                  </div>
                  <div className="text-xs text-emerald-900/50 shrink-0">{toLocalDate(a.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="clock" title="Quiet so far" hint="Actions you take will show up here." />
          )}
        </Card>
      </div>
    </div>
  );
}