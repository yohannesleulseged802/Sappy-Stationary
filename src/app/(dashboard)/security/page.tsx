"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import MasterGate from "@/components/ui/MasterGate";

export default function SecurityPage() {
  const [changing, setChanging] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [msg, setMsg] = useState("");

  async function changeMaster(current: string) {
    const r = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentMaster: current, newMaster: newCode }),
    });
    const j = await r.json();
    if (j.ok) { setMsg("Master code updated."); setChanging(false); setNewCode(""); }
    else setMsg("Current master code was wrong.");
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-3xl">Security</h1>
        <p className="text-emerald-800/70">Master code protects destructive actions.</p>
      </div>

      <Card title="Master code">
        <p className="text-sm text-emerald-800/70">Required for: reset all data, delete inventory, void/delete sales, delete expenses, manage users.</p>
        {!changing ? (
          <button onClick={() => setChanging(true)} className="mt-3 rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold">Change master code</button>
        ) : (
          <div className="mt-3 space-y-2">
            <input type="password" placeholder="New master code" value={newCode} onChange={e=>setNewCode(e.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2" />
            <MasterGate title="Confirm current master code" onOk={(cur) => changeMaster(cur)} onCancel={() => setChanging(false)} />
          </div>
        )}
        {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}
      </Card>

      <Card title="Danger zone" className="mt-4">
        <p className="text-sm text-emerald-800/70">Reset everything (inventory, sales, expenses, credits, POs). This cannot be undone.</p>
        <MasterGate
          title="Reset all data"
          buttonLabel="Reset everything"
          buttonTone="danger"
          onOk={async () => {
            const r = await fetch("/api/repair?reset=1", { method: "POST" });
            const j = await r.json();
            alert(j.ok ? "All data cleared." : "Failed.");
          }}
          onCancel={() => {}}
        />
      </Card>
    </div>
  );
}