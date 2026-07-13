import { CheckSquare, Square, Download, X, Loader2, Trash2 } from "lucide-react";

/**
 * "Select all / N selected / Download ZIP" toolbar shown above any photo
 * grid. Purely presentational + callbacks — each page owns its own
 * selection state (a Set of photo ids) and passes the derived booleans in.
 *
 * onDeleteSelected is optional — pass it on the organiser/admin galleries
 * (so a mis-uploaded photo can be cleared in bulk) and leave it unset on
 * the guest gallery, which should stay view/download-only.
 */
export function PhotoSelectionBar({
  total,
  selectedCount,
  allSelected,
  onToggleAll,
  onDownloadZip,
  onClearSelection,
  onDeleteSelected,
  downloading,
  deleting,
}) {
  if (!total) return null;

  return (
    <div className="flex items-center gap-2 mb-5 flex-wrap">
      <button
        type="button"
        onClick={onToggleAll}
        className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:border-pink-300 dark:hover:border-pink-500/40 transition active:scale-95"
      >
        {allSelected ? <CheckSquare size={14} className="text-pink-500" /> : <Square size={14} />}
        {allSelected ? "Deselect all" : "Select all"}
      </button>

      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
        {selectedCount > 0 ? `${selectedCount} selected` : `${total} photo${total > 1 ? "s" : ""}`}
      </span>

      {selectedCount > 0 && (
        <>
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={downloading}
            className="flex items-center gap-1.5 bg-gray-950 dark:bg-pink-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition active:scale-95 disabled:opacity-50"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloading ? "Zipping…" : `Download ZIP`}
          </button>
          {onDeleteSelected && (
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 text-red-500 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition active:scale-95 disabled:opacity-50"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          <button
            type="button"
            onClick={onClearSelection}
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 px-3 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition"
          >
            <X size={14} /> Clear
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Small circular toggle rendered in the corner of a photo tile. Always
 * visible (filled) once selected; fades in on hover otherwise, so the
 * grid doesn't look cluttered with checkboxes when nobody's selecting.
 */
export function SelectToggle({ selected, onToggle, className = "" }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={selected ? "Deselect photo" : "Select photo"}
      aria-pressed={selected}
      className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
        selected
          ? "bg-pink-500 text-white opacity-100"
          : "bg-black/40 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-black/60"
      } ${className}`}
    >
      {selected ? <CheckSquare size={15} /> : <Square size={15} />}
    </button>
  );
}
