"use client";
import { motion } from "framer-motion";
export default function LoadingVeil({ progress, status }: { progress: number; status: string }) {
  return (
    <div className="fixed inset-0 z-[60] bg-cream grid place-items-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-600 text-white grid place-items-center text-3xl font-display font-bold shadow-lg">S</div>
        <div className="mt-4 font-display text-2xl">Sappy Stationary</div>
        <div className="mt-6 w-64 h-2 bg-emerald-100 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-sm text-emerald-800/70">{Math.round(progress)}% • {status}</div>
      </motion.div>
    </div>
  );
}