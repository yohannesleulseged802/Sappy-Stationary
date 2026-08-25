import { motion, AnimatePresence } from "framer-motion";
export default function Modal({ open, onClose, title, children }: any) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xl">{title}</h3>
              <button onClick={onClose} className="text-emerald-700">✕</button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}