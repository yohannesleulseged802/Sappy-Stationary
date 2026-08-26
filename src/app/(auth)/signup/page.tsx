"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "@/components/ui/Logo";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterCode, setMasterCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setErr("Password must be 8+ characters");
    setErr("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, masterCode, redirect: false });
    setLoading(false);
    if (res?.error) setErr("Invalid master code, or email already exists");
    else if (res?.ok) window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <motion.form
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl shadow-soft p-8"
      >
        <Logo className="w-14 h-14 mx-auto" rounded="rounded-2xl" />
        <h1 className="font-display text-2xl text-center mt-3">Create your account</h1>
        <p className="text-center text-sm text-emerald-900/60">You need the master code from the owner</p>

        <label className="block mt-6 text-sm font-medium">Your name</label>
        <input required value={name} onChange={e => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3" />

        <label className="block mt-4 text-sm font-medium">Email</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3" />

        <label className="block mt-4 text-sm font-medium">Password (8+ chars)</label>
        <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3" />

        <label className="block mt-4 text-sm font-medium">Master code</label>
        <input required type="password" value={masterCode} onChange={e => setMasterCode(e.target.value)}
          className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3" />

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <button disabled={loading}
          className="mt-6 w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 disabled:opacity-60">
          {loading ? "Creating…" : "Create account"}
        </button>

        <p className="text-center text-sm mt-4">
          Already have an account? <Link href="/login" className="text-emerald-700 font-semibold">Sign in</Link>
        </p>
      </motion.form>
    </div>
  );
}