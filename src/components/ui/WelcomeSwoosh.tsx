"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function WelcomeSwoosh({ name, onDone }: { name: string; onDone: () => void }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let x = 0;
    const t = setInterval(() => {
      x += 5;
      setP(x);
      if (x >= 100) { clearInterval(t); setTimeout(onDone, 400); }
    }, 40);
    return () => clearInterval(t);
  }, [onDone]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-gradient-to-br from-emerald-700 to-emerald-900 text-white grid place-items-center">
      <div className="text-center relative">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }}
          className="mx-auto w-24 h-24 rounded-3xl bg-white text-emerald-700 grid place-items-center text-5xl font-display font-bold shadow-2xl">S</motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-6 font-display text-4xl">Welcome, {name}</motion.div>
        <div className="mt-6 w-72 h-2 bg-white/20 rounded-full overflow-hidden mx-auto relative">
          <div className="h-full bg-white" style={{ width: `${p}%` }} />
          <div className="sweep" />
        </div>
        <div className="mt-2 text-white/80">{p}%</div>
      </div>
    </motion.div>
  );
}