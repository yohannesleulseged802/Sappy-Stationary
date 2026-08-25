"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import MasterGate from "@/components/ui/MasterGate";
import { useSession } from "next-auth/react";

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetFor, setResetFor] = useState<null | string>(null);
  const [newPw, setNewPw] = useState("");
  const [deleteFor, setDeleteFor] = useState<null | string>(null);

  async function load() {
    const r = await fetch("/api/users"); const j = await r.json(); setUsers(j);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const j = await r.json();
    if (j.ok) { setShowAdd(false); setName(""); setEmail(""); setPassword(""); load(); }
    else alert(j.error || "Failed");
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl">Users</h1>
          <p className="text-emerald-800/70">Manage staff accounts.</p>
        </div>
        <MasterGate title="Add user" buttonLabel="+ Add user" onOk={async () => setShowAdd(true)} onCancel={() => {}} />
      </div>

      <Card>
        <div className="divide-y divide-emerald-100">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{u.name} <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 ml-1">{u.role}</span></div>
                <div className="text-xs text-emerald-800/60">{u.email}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setResetFor(u.id)} className="text-xs rounded-full bg-stone-100 px-3 py-1">Reset password</button>
                {u.id !== (session?.user as any)?.id && (
                  <button onClick={() => setDeleteFor(u.id)} className="text-xs rounded-full bg-red-50 text-red-600 px-3 py-1">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-display text-xl">Add user</h3>
            <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="mt-3 w-full rounded-xl border border-emerald-200 px-4 py-2" />
            <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-emerald-200 px-4 py-2" />
            <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-emerald-200 px-4 py-2" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-emerald-200 py-2">Cancel</button>
              <button onClick={add} className="flex-1 rounded-xl bg-emerald-600 text-white py-2">Add</button>
            </div>
          </div>
        </div>
      )}

      {resetFor && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-display text-xl">Reset password</h3>
            <input placeholder="New password" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} className="mt-3 w-full rounded-xl border border-emerald-200 px-4 py-2" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setResetFor(null); setNewPw(""); }} className="flex-1 rounded-xl border border-emerald-200 py-2">Cancel</button>
              <button onClick={async () => {
                await fetch(`/api/users/${resetFor}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: newPw }) });
                setResetFor(null); setNewPw("");
              }} className="flex-1 rounded-xl bg-emerald-600 text-white py-2">Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteFor && (
        <MasterGate
          title="Delete user"
          onOk={async () => {
            await fetch(`/api/users/${deleteFor}`, { method: "DELETE" });
            setDeleteFor(null); load();
          }}
          onCancel={() => setDeleteFor(null)}
        />
      )}
    </div>
  );
}