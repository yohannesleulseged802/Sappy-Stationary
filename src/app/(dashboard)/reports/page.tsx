"use client";
import ReportTabs from "@/components/modules/ReportTabs";
export default function ReportsPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-3xl">Reports</h1>
        <p className="text-emerald-800/70">Sales, inventory, profit, stock alerts, purchasing.</p>
      </div>
      <ReportTabs />
    </div>
  );
}