"use client";
import { useEffect, useState } from "react";
import Card from "../ui/Card";
import Icon from "../ui/Icon";
import { fmt, num } from "@/lib/money";
import { toLocalDate } from "@/lib/utils";

const TABS = ["Sales", "Inventory value", "Profit & margin", "Stock alerts", "Purchasing"];

export default function ReportTabs() {
  const [tab, setTab] = useState("Sales");
  const [range, setRange] = useState<"day" | "week" | "year">("week");
  const [sort, setSort] = useState("newest");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/reports?view=${encodeURIComponent(tab)}&range=${range}&sort=${sort}`)
      .then(r => r.json()).then(setData);
  }, [tab, range, sort]);

  async function downloadPdf() {
    const r = await fetch(`/api/reports?view=${encodeURIComponent(tab)}&range=${range}&sort=${sort}&pdf=1`);
    const b = await r.blob();
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u; a.download = `${tab.replace(/\s+/g, "-").toLowerCase()}.pdf`; a.click();
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0 -mx-4 px-4 md:mx-0 md:px-0 pb-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap shrink-0 transition ${
                tab === t ? "bg-emerald-600 text-white" : "bg-white border border-emerald-200 text-emerald-700"
              }`}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={downloadPdf}
          className="rounded-xl border border-emerald-600 text-emerald-700 px-3 md:px-4 py-2 font-semibold hover:bg-emerald-50 transition flex items-center gap-2 shrink-0">
          <Icon name="download" className="w-4 h-4" /> <span className="hidden sm:inline">Download PDF</span>
        </button>
      </div>

      {tab === "Sales" && (
        <Card>
          <div className="flex flex-wrap gap-2 mb-3">
            {(["day", "week", "year"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-full text-sm ${range === r ? "bg-emerald-600 text-white" : "bg-white border border-emerald-200"}`}>
                {r}
              </button>
            ))}
            <span className="w-px h-6 bg-emerald-100 mx-1" />
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
              <option value="item">By invoice #</option>
            </select>
          </div>
          <div className="font-display text-3xl mb-2">{fmt(data?.total || 0)}</div>
          <div className="text-sm text-emerald-900/60 mb-3">{data?.count || 0} sales</div>
          <div className="divide-y divide-emerald-100">
            {(data?.rows || []).map((r: any) => (
              <div key={r.id} className="flex justify-between py-2 gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.invoiceNo}</div>
                  <div className="text-xs text-emerald-900/60 truncate">{toLocalDate(r.date)} • {r.paymentMethod} • by {r.userName}</div>
                </div>
                <div className="font-display shrink-0">{fmt(r.total)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Inventory value" && (
        <Card>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl bg-emerald-50 p-3 min-w-0"><div className="text-xs">Cost value</div><div className="font-display text-lg md:text-xl truncate">{fmt(data?.costValue || 0)}</div></div>
            <div className="rounded-xl bg-emerald-50 p-3 min-w-0"><div className="text-xs">Sell value</div><div className="font-display text-lg md:text-xl truncate">{fmt(data?.sellValue || 0)}</div></div>
            <div className="rounded-xl bg-emerald-50 p-3 min-w-0"><div className="text-xs">Potential profit</div><div className="font-display text-lg md:text-xl truncate">{fmt(data?.profit || 0)}</div></div>
            <div className="rounded-xl bg-emerald-50 p-3 min-w-0"><div className="text-xs">Items</div><div className="font-display text-lg md:text-xl">{data?.count || 0}</div></div>
          </div>
          <div className="divide-y divide-emerald-100">
            {(data?.rows || []).map((r: any) => (
              <div key={r.id} className="flex justify-between py-2 gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-emerald-900/60 truncate">{r.category} • qty {r.quantity}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display">{fmt(r.sellValue)}</div>
                  <div className="text-xs text-emerald-900/60">cost {fmt(r.costValue)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Profit & margin" && (
        <Card>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-xl bg-emerald-50 p-3 min-w-0"><div className="text-[11px]">Revenue</div><div className="font-display text-base md:text-xl truncate">{fmt(data?.revenue || 0)}</div></div>
            <div className="rounded-xl bg-emerald-50 p-3 min-w-0"><div className="text-[11px]">COGS</div><div className="font-display text-base md:text-xl truncate">{fmt(data?.cogs || 0)}</div></div>
            <div className="rounded-xl bg-emerald-50 p-3 min-w-0"><div className="text-[11px]">Margin</div><div className="font-display text-base md:text-xl">{(data?.margin || 0).toFixed(1)}%</div></div>
          </div>
          <div className="divide-y divide-emerald-100">
            {(data?.rows || []).map((r: any) => (
              <div key={r.name} className="flex justify-between py-2 gap-3 min-w-0">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-right shrink-0">
                  <div className="font-display">{fmt(r.profit)}</div>
                  <div className="text-xs text-emerald-900/60">{r.margin.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Stock alerts" && (
        <Card>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl bg-red-50 p-3"><div className="text-xs">Out of stock</div><div className="font-display text-xl">{data?.out || 0}</div></div>
            <div className="rounded-xl bg-amber-50 p-3"><div className="text-xs">Low stock</div><div className="font-display text-xl">{data?.low || 0}</div></div>
          </div>
          <div className="divide-y divide-emerald-100">
            {(data?.rows || []).map((r: any) => (
              <div key={r.id} className="flex justify-between py-2 gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-emerald-900/60 truncate">{r.category}</div>
                </div>
                <div className={`font-display shrink-0 ${r.quantity === 0 ? "text-red-600" : "text-amber-600"}`}>{r.quantity}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Purchasing" && (
        <Card>
          <div className="font-display text-3xl mb-2">{fmt(data?.total || 0)}</div>
          <div className="text-sm text-emerald-900/60 mb-3">Total spend</div>
          <div className="divide-y divide-emerald-100">
            {(data?.rows || []).map((r: any) => (
              <div key={r.id} className="flex justify-between py-2 gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.poNumber} • {r.supplier}</div>
                  <div className="text-xs text-emerald-900/60 truncate">{toLocalDate(r.date)} • {r.status}</div>
                </div>
                <div className="font-display shrink-0">{fmt(r.total)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}