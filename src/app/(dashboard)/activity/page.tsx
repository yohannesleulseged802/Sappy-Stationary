"use client";
import { useEffect, useState } from "react";
import ActivityTimeline from "@/components/modules/ActivityTimeline";
export default function ActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { fetch("/api/activity").then(r=>r.json()).then(setItems); }, []);
  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-3xl">Activity log</h1>
        <p className="text-emerald-800/70">Who did what, and when.</p>
      </div>
      <ActivityTimeline items={items} />
    </div>
  );
}