"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { toLocalDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function DevicesPage() {
  const { data: session } = useSession();
  const [devices, setDevices] = useState<any[]>([]);

  async function load() {
    const r = await fetch("/api/devices"); const j = await r.json(); setDevices(j);
  }
  useEffect(() => { load(); }, []);

  async function logout(id: string) {
    await fetch(`/api/devices/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-3xl">Devices</h1>
        <p className="text-emerald-800/70">Signed-in sessions. Log out any device remotely.</p>
      </div>
      <Card>
        <div className="divide-y divide-emerald-100">
          {devices.map(d => (
            <div key={d.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{d.label}</div>
                <div className="text-xs text-emerald-800/60">Last active {toLocalDate(d.lastActive)}</div>
              </div>
              <button onClick={() => logout(d.id)} className="text-xs rounded-full bg-red-50 text-red-600 px-3 py-1">Log out</button>
            </div>
          ))}
          {devices.length === 0 && <p className="py-6 text-center text-emerald-800/60">No sessions.</p>}
        </div>
      </Card>
    </div>
  );
}