import { motion, AnimatePresence } from "framer-motion";

export default function Modal({ open, onClose, title, children }: any) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={onClose}>
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3 sticky top-0 bg-white/95 backdrop-blur -mx-5 px-5 pt-1 pb-2 border-b border-emerald-50">
                <h3 className="font-display text-xl truncate pr-2">{title}</h3>
                <button onClick={onClose} className="text-emerald-700 hover:bg-emerald-50 rounded-lg w-8 h-8 grid place-items-center shrink-0">✕</button>
              </div>
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}