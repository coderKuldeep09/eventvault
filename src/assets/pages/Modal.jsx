import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * Shared modal shell used by CreateEventModal, EventAccessPanel and the
 * plan-upgrade dialog, so all three "float above the dashboard" moments
 * look and behave the same way.
 */
export function Modal({ open, onClose, title, eyebrow, children, maxWidth = "max-w-lg" }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${maxWidth} max-h-[88vh] overflow-y-auto rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl`}
          >
            <div className="sticky top-0 flex items-start justify-between gap-4 px-7 pt-7 pb-4 bg-white dark:bg-gray-900 z-10">
              <div>
                {eyebrow && (
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500 mb-1">{eyebrow}</p>
                )}
                {title && (
                  <h3 className="font-black italic tracking-tighter text-2xl text-gray-900 dark:text-white">
                    {title}
                  </h3>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-gray-800 transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-7 pb-7">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
