import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Moon, Sun, Maximize2, Sparkles, X, Search, ShieldCheck, LogOut, Share2, Calendar, Trash2,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Modal } from "./Modal";
import { EventAccessPanel } from "./EventAccessPanel";
import { PhotoSelectionBar, SelectToggle } from "./PhotoSelectionBar";
import { downloadPhotosAsZip } from "../lib/downloadZip";
import {
  getSession,
  clearSession,
  getEventBySlug,
  getEventPhotos,
  deleteEventPhoto,
  daysRemaining,
  isEventExpired,
} from "../lib/store";

// Admin = the event owner's full, unfiltered vault — every category, no
// face-match needed (that's the guest side's job). There's no separate
// admin login screen any more: the owner signs in on the exact same
// /login page guests use, just with their own unique admin ID + password
// instead of the shared guest one (see Login.jsx). This route only
// renders once that sign-in has already set an "admin" session for this
// specific event — otherwise it bounces back to /login.
function AdminVault({ event, onLock }) {
  const { dark: darkMode, toggleTheme } = useTheme();
  const [selectedImg, setSelectedImg] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [shareOpen, setShareOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const allPhotos = getEventPhotos(event.id);
  const categoryNames = useMemo(() => ["All", ...event.categories.map((c) => c.name)], [event.categories]);
  const displayPhotos = useMemo(
    () => (activeCategory === "All" ? allPhotos : allPhotos.filter((img) => img.categoryName === activeCategory)),
    [activeCategory, allPhotos]
  );

  // Selection is scoped to whatever's currently on screen — switching
  // folders starts fresh rather than carrying a stale set across (reset
  // happens directly in the nav item's onClick below, not via effect).
  const allSelected = displayPhotos.length > 0 && selected.size === displayPhotos.length;

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(displayPhotos.map((p) => p.id)));
  }

  async function handleDownloadZip() {
    const photos = displayPhotos.filter((p) => selected.has(p.id));
    if (!photos.length) return;
    setDownloading(true);
    const zipLabel = `${event.name}${activeCategory !== "All" ? `-${activeCategory}` : ""}`;
    const result = await downloadPhotosAsZip(photos, zipLabel);
    setDownloading(false);
    if (result.ok) {
      toast.success(`Zipped ${photos.length - (result.failed || 0)} photo${photos.length > 1 ? "s" : ""}`);
    } else {
      toast.error("Couldn't build the zip — try again");
    }
  }

  function handleDeleteSelected() {
    const ids = displayPhotos.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} photo${ids.length > 1 ? "s" : ""}? This can't be undone.`)) return;

    setDeleting(true);
    for (const id of ids) deleteEventPhoto(event.id, id);
    setSelected(new Set());
    setDeleting(false);
    toast.success(`Deleted ${ids.length} photo${ids.length > 1 ? "s" : ""}`);
  }

  const expired = isEventExpired(event);
  const remaining = daysRemaining(event);

  return (
    <div className={`h-screen w-full overflow-hidden flex flex-col transition-colors duration-500 ${darkMode ? 'bg-[#0a0a0a] text-white' : 'bg-[#fffafa] text-gray-900'}`}>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #ec4899; border-radius: 10px; }
      `}</style>

      {selectedImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <button onClick={() => setSelectedImg(null)} className="absolute top-10 right-10 text-white hover:rotate-90 transition-transform">
            <X size={40} />
          </button>
          <img src={selectedImg} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" alt="Zoomed" />
        </div>
      )}

      {/* FIXED HEADER */}
      <header className="flex-none pt-3 pb-1 px-10 max-w-[1800px] w-full mx-auto flex justify-between items-start z-10 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-pink-500 font-black text-[10px] uppercase tracking-[0.4em] mb-1">
            <ShieldCheck size={12} /> Face Vault Admin
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter leading-none bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent truncate">
            {event.name}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1.5 flex items-center gap-2">
            Browsing: {activeCategory}
            {event.date && (
              <span className="flex items-center gap-1">
                <span className="text-gray-200 dark:text-gray-700">·</span>
                <Calendar size={10} /> {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            <span className="text-gray-200 dark:text-gray-700">·</span>
            <span className={expired ? "text-red-500" : remaining <= 7 ? "text-amber-500" : ""}>
              {expired ? "Expired" : `${remaining}d left`}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShareOpen(true)}
            className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border dark:border-gray-800 hover:scale-110 transition-all active:scale-95"
            title="Share with guests"
          >
            <Share2 className="text-pink-500" size={18} />
          </button>
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border dark:border-gray-800 hover:scale-110 transition-all active:scale-95"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="text-yellow-400" size={18} /> : <Moon className="text-pink-500" size={18} />}
          </button>
          <button
            onClick={onLock}
            className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border dark:border-gray-800 hover:scale-110 transition-all active:scale-95"
            title="Lock vault"
          >
            <LogOut className="text-gray-400" size={18} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-h-0 overflow-hidden px-10 pb-8 max-w-[1800px] w-full mx-auto grid grid-cols-12 gap-8">

        {/* LEFT PANEL */}
        <div className="col-span-12 lg:col-span-3 h-full min-h-0 flex flex-col gap-6 overflow-hidden">

          <div className={`p-6 rounded-[2.5rem] border shadow-xl flex flex-col overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-pink-50'}`}>
             <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Navigation</h2>
             <div className="space-y-2 overflow-y-auto no-scrollbar pr-1">
                {categoryNames.map(cat => (
                   <button
                     key={cat}
                     onClick={() => { setActiveCategory(cat); setSelected(new Set()); }}
                     className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${activeCategory === cat ? 'bg-pink-500 text-white shadow-md shadow-pink-200' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400'}`}
                   >
                     <span className="text-sm">{cat}</span>
                     {activeCategory === cat && <Sparkles size={14} />}
                   </button>
                ))}
             </div>
          </div>

          <div className={`flex-1 min-h-[200px] p-6 rounded-[2.5rem] border flex flex-col justify-between ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-pink-50'}`}>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Vault stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-pink-500">{allPhotos.length}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">Photos</p>
                </div>
                <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-pink-500">{event.categories.length}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">Folders</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShareOpen(true)}
              className="w-full mt-4 bg-gray-950 dark:bg-pink-600 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <Share2 size={14} /> Share with guests
            </button>
          </div>
        </div>

        {/* RIGHT: GALLERY DISPLAY */}
        <div className="col-span-12 lg:col-span-9 h-full min-h-0 overflow-y-auto custom-scroll pr-4 pb-6">
          {displayPhotos.length > 0 ? (
            <>
              <PhotoSelectionBar
                total={displayPhotos.length}
                selectedCount={selected.size}
                allSelected={allSelected}
                onToggleAll={toggleAll}
                onDownloadZip={handleDownloadZip}
                onDeleteSelected={handleDeleteSelected}
                onClearSelection={() => setSelected(new Set())}
                downloading={downloading}
                deleting={deleting}
              />
              <div className="columns-1 md:columns-2 gap-6 space-y-6">
                {displayPhotos.map((img) => (
                  <div key={img.id} className="relative group rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-gray-900 shadow-xl bg-white dark:bg-gray-900 break-inside-avoid animate-in zoom-in duration-500 hover:shadow-pink-500/10 transition-all">
                    <img
                      src={img.src}
                      className="w-full h-auto object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-700"
                      onClick={() => setSelectedImg(img.src)}
                      loading="lazy"
                      alt={img.name}
                    />

                    <SelectToggle selected={selected.has(img.id)} onToggle={() => toggleOne(img.id)} />

                    <div className="absolute top-4 left-4">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-3 py-1 rounded-full uppercase">
                          {img.categoryName}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-8 flex items-end justify-between pointer-events-none">
                       <div className="flex flex-col">
                          <p className="text-[8px] font-black text-pink-400 uppercase tracking-widest mb-1">Full vault</p>
                          <p className="text-xs font-bold text-white uppercase tracking-tighter">{img.sizeMB} MB</p>
                       </div>
                       <button
                         onClick={(e) => { e.stopPropagation(); setSelectedImg(img.src); }}
                         className="p-3 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-pink-500 transition-colors pointer-events-auto"
                       >
                         <Maximize2 size={16} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="relative min-h-[65vh] flex flex-col items-center justify-center bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:bg-transparent border-4 border-dashed border-gray-200 dark:border-gray-800 rounded-[4rem] text-center p-10 transition-all hover:border-pink-300 dark:hover:border-gray-700 hover:bg-pink-50/30 dark:hover:bg-gray-900/60 group overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="w-64 h-64 bg-violet-400/5 dark:bg-violet-500/5 blur-3xl rounded-full" />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-24 h-24 mb-6 rounded-[2rem] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-inner flex items-center justify-center border border-gray-200 dark:border-gray-700 group-hover:scale-110 transition-transform duration-500">
                    <Search size={40} className="text-gray-300 dark:text-gray-600 group-hover:text-violet-400 transition-colors duration-500" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-800 dark:text-gray-200 uppercase tracking-tighter italic mb-3">
                    {allPhotos.length === 0 ? "No Photos Yet" : "No Matches Found"}
                  </h3>
                  <p className="text-gray-400 text-sm max-w-[280px] font-medium leading-relaxed">
                    {allPhotos.length === 0
                      ? "Once the organiser uploads photos to this event, they'll show up here."
                      : "Try another folder from the left to find what you're looking for."}
                  </p>
                </div>
            </div>
          )}
        </div>
      </main>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} eyebrow="Share access" title={event.name} maxWidth="max-w-xl">
        <EventAccessPanel event={event} />
      </Modal>
    </div>
  );
}

export default function AdminLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const event = useMemo(() => getEventBySlug(slug), [slug]);
  const session = getSession();
  const authorized = event && session?.role === "admin" && session.eventId === event.id;

  // No credential form lives here any more — admin sign-in happens on
  // the shared /login page (see Login.jsx). If someone lands on this
  // URL without that session already set (e.g. a stale bookmark, or
  // trying someone else's event), send them back there instead of
  // showing a dead end.
  useEffect(() => {
    if (!authorized) navigate("/login", { replace: true });
  }, [authorized, navigate]);

  if (!authorized) return null;

  return (
    <AdminVault
      event={event}
      onLock={() => {
        clearSession();
        navigate("/login");
      }}
    />
  );
}
