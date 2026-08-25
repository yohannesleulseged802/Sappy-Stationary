"use client";
import { useState } from "react";
import Modal from "./Modal";
export default function MasterGate({ title, onOk, onCancel, buttonLabel, buttonTone }: any) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    const r = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masterCode: code }),
    });
    const j = await r.json();
    if (j.ok) { setOpen(false); setCode(""); setErr(""); await onOk(code); }
    else setErr("Incorrect master code");
  }

  if (buttonLabel) {
    return (
      <>
        <button onClick={() => setOpen(true)}
          className={`rounded-xl px-4 py-2 font-semibold ${buttonTone === "danger" ? "bg-red-500 text-white" : "bg-emerald-600 text-white"}`}>
          {buttonLabel}
        </button>
        <Modal open={open} onClose={() => { setOpen(false); onCancel?.(); }} title={title}>
          <p className="text-sm text-emerald-800/70">Enter the master code to continue.</p>
          <input type="password" value={code} onChange={e=>setCode(e.target.value)} placeholder="Master code"
            className="mt-3 w-full rounded-xl border border-emerald-200 px-4 py-2" />
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setOpen(false); onCancel?.(); }} className="flex-1 rounded-xl border border-emerald-200 py-2">Cancel</button>
            <button onClick={submit} className="flex-1 rounded-xl bg-emerald-600 text-white py-2">Confirm</button>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <Modal open={true} onClose={onCancel} title={title}>
      <p className="text-sm text-emerald-800/70">Enter the master code to continue.</p>
      <input type="password" value={code} onChange={e=>setCode(e.target.value)} placeholder="Master code"
        className="mt-3 w-full rounded-xl border border-emerald-200 px-4 py-2" />
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
      <div className="flex gap-2 mt-4">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-emerald-200 py-2">Cancel</button>
        <button onClick={submit} className="flex-1 rounded-xl bg-emerald-600 text-white py-2">Confirm</button>
      </div>
    </Modal>
  );
}