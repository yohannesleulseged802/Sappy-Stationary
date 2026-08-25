"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent("sappy-toast", { detail: msg }));
}
export default function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const h = (e: any) => { setMsg(e.detail); setTimeout(() => setMsg(null), 2400); };
    window.addEventListener("sappy-toast", h);
    return () => window.removeEventListener("sappy-toast", h);
  }, []);
  return (
    <AnimatePresence>
      {msg && (
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-emerald-800 text-white px-4 py-2 rounded-full shadow-lg z-50">
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}