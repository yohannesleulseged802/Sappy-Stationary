"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/ui/Logo";

export default function AuthBlade({ initialMode }: { initialMode: "login" | "signup" }) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const signup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [master, setMaster] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (signup && password.length < 8) return setErr("Password must be 8+ characters");
    setLoading(true);
    const res = await signIn("credentials", { email, password, name, masterCode: master, redirect: false });
    setLoading(false);
    if (res?.error) setErr(signup ? "Invalid master code, or email already exists" : "Invalid email or password");
    else if (res?.ok) window.location.href = "/dashboard";
  }

  const input = "w-full bg-transparent border-b border-emerald-900/20 focus:border-emerald-600 focus:outline-none py-2.5 text-[15px] placeholder:text-emerald-900/40 transition-colors";
  const btn = "w-full rounded-full bg-emerald-700 text-white py-3 font-semibold hover:bg-emerald-800 active:scale-[0.99] transition disabled:opacity-60";

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="relative w-full max-w-4xl rounded-[28px] overflow-hidden shadow-2xl bg-[#F7F3EA] min-h-[560px]">

        {/* The sliding blade */}
        <motion.div
          className="hidden md:block absolute inset-y-[-60px] left-[-6%] w-[56%] z-10 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 shadow-2xl"
          initial={false}
          animate={{ x: signup ? "86%" : "0%" }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          style={{ skewX: -12 }}
        >
          <div className="h-full grid place-items-center" style={{ skewX: 12 }}>
            <div className="max-w-xs px-6">
              <div className="flex items-center gap-2 mb-6">
                <Logo className="w-9 h-9" />
                <span className="tracking-[0.3em] text-[11px] text-emerald-100/70 uppercase">Sappy</span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={mode}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.25 }}>
                  <h2 className="font-display text-4xl leading-tight text-white">
                    {signup ? <>Start the<br /><em className="text-amber-300">first page.</em></> : <>Welcome<br /><em className="text-amber-300">back, friend.</em></>}
                  </h2>
                  <p className="mt-4 text-sm text-emerald-100/70">
                    {signup
                      ? "One account for every sale, every stock count and every device you own."
                      : "Your counters, credits and codes — right where you left them."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Mobile brand strip */}
        <div className="md:hidden flex items-center gap-2 px-6 pt-6">
          <Logo className="w-9 h-9" />
          <div>
            <div className="font-display text-lg leading-none">Sappy Stationary</div>
            <div className="text-[11px] text-emerald-900/50">stationery & printing</div>
          </div>
        </div>

        {/* Form half (slides opposite the blade) */}
        <div className={`relative md:absolute md:inset-y-0 md:w-1/2 p-6 md:p-10 md:transition-all md:duration-500 ${signup ? "md:left-0" : "md:left-1/2"}`}>
          <div className="h-full flex flex-col justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={mode}
                initial={{ opacity: 0, x: signup ? -24 : 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: signup ? 24 : -24 }}
                transition={{ duration: 0.22 }}>

                {signup ? (
                  <form onSubmit={submit} className="space-y-5">
                    <div>
                      <h1 className="font-display text-2xl">Create account</h1>
                      <div className="mt-1 h-0.5 w-10 bg-amber-400 rounded-full" />
                    </div>
                    <input className={input} required value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
                    <input className={input} required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
                    <div>
                      <input className={input} required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                      <p className="text-[11px] text-emerald-900/50 mt-1 text-right">Use 8 characters or more.</p>
                    </div>
                    <input className={input} required type="password" value={master} onChange={e => setMaster(e.target.value)} placeholder="Master code" />
                    {err && <p className="text-sm text-red-600">{err}</p>}
                    <button disabled={loading} className={btn}>{loading ? "Creating…" : "Create account"}</button>
                    <p className="text-center text-sm text-emerald-900/60">
                      Already have an account?{" "}
                      <button type="button" onClick={() => setMode("login")} className="font-semibold text-emerald-800 underline underline-offset-4">Sign in</button>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={submit} className="space-y-5">
                    <div>
                      <h1 className="font-display text-2xl">Sign in</h1>
                      <div className="mt-1 h-0.5 w-10 bg-amber-400 rounded-full" />
                    </div>
                    <input className={input} required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
                    <input className={input} required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                    {err && <p className="text-sm text-red-600">{err}</p>}
                    <button disabled={loading} className={btn}>{loading ? "Signing in…" : "Sign in"}</button>
                    <p className="text-center text-sm text-emerald-900/60">
                      No account?{" "}
                      <button type="button" onClick={() => setMode("signup")} className="font-semibold text-emerald-800 underline underline-offset-4">Create one</button>
                    </p>
                  </form>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}