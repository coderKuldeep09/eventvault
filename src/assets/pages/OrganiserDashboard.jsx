import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import Masonry from "react-masonry-css";
import {
  Trash2, CloudUpload, ArrowLeft, Upload,
  Plus, X, FolderPlus, Image as ImageIcon, Share2, Sparkles, ScanFace, Layers, RefreshCw, AlertTriangle,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import toast from "react-hot-toast";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import {
  getEventBySlug,
  addCategory as storeAddCategory,
  removeCategory as storeRemoveCategory,
  getEventPhotos,
  addEventPhotos,
  deleteEventPhoto,
  getEventStorageUsedMB,
  isEventExpired,
  daysRemaining,
  upgradeEventPlan,
  deleteEvent,
} from "../lib/store";
import { EventAccessPanel } from "./EventAccessPanel";
import { PlanPicker } from "./PlanPicker";
import { Modal } from "./Modal";
import { PhotoSelectionBar, SelectToggle } from "./PhotoSelectionBar";
import { downloadPhotosAsZip } from "../lib/downloadZip";

// A virtual "folder" that shows everything at once, same idea as the
// admin vault's "All" tab — lets the organiser see (and select/zip/scan)
// every photo in the event without picking a category first.
const ALL_VIEW = { id: "__all__", name: "All photos" };

export default function OrganiserDashboard() {
  // Use the real theme context (dark / toggleTheme) instead of the old
  // darkMode/setDarkMode keys that don't exist on it — that mismatch was
  // why dark mode looked broken on this page.
  const { dark: darkMode } = useTheme();
  const { slug } = useParams();
  const navigate = useNavigate();

  // ProtectedRoute (App.jsx) already checked this event belongs to the
  // logged-in organiser before this component ever renders.
  const [event, setEvent] = useState(() => getEventBySlug(slug));
  const [images, setImages] = useState(() => (event ? getEventPhotos(event.id) : []));
  const [activeCategory, setActiveCategory] = useState(ALL_VIEW);
  const [newCatName, setNewCatName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [deleteEventOpen, setDeleteEventOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(event?.plan.id || "standard");

  // --- Face scan: the same "upload a selfie, scan the album" tool
  // guests get, available to the organiser too so they can preview it
  // or pull up one guest's photos on request without leaving the
  // dashboard. There's no real recognition model yet — same mock as the
  // guest side (see UserPage.jsx) — it "finds" everything in scope.
  const [scanOpen, setScanOpen] = useState(false);
  const [scanImage, setScanImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [scanResults, setScanResults] = useState([]);

  const [selected, setSelected] = useState(new Set());
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function refreshEvent() {
    const updated = getEventBySlug(slug);
    setEvent(updated);
    setSelectedPlan(updated?.plan.id);
    return updated;
  }

  const addCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (event.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`"${trimmed}" already exists`);
      return;
    }
    const updated = storeAddCategory(event.id, trimmed);
    setEvent(updated);
    setActiveCategory(updated.categories[updated.categories.length - 1]);
    setSelected(new Set());
    setNewCatName("");
    toast.success(`Folder "${trimmed}" created`);
  };

  const removeCategory = (cat) => {
    const updated = storeRemoveCategory(event.id, cat.id);
    setEvent(updated);
    setImages(getEventPhotos(event.id));
    if (activeCategory?.id === cat.id) {
      setActiveCategory(ALL_VIEW);
      setSelected(new Set());
    }
    toast.error("Folder removed");
  };

  const onDrop = (files) => {
    if (!activeCategory || activeCategory.id === ALL_VIEW.id) return toast.error("Pick a specific folder first!");
    setIsUploading(true);
    // Brief pause so the drop still *feels* like an upload — once real
    // cloud storage is wired in, this is where that network call goes.
    setTimeout(() => {
      const updated = addEventPhotos(event.id, activeCategory, files);
      setImages(updated);
      setIsUploading(false);
      toast.success(`Added ${files.length} photo${files.length > 1 ? "s" : ""}`);
    }, 500);
  };

  const { getRootProps, getInputProps, open: openFilePicker } = useDropzone({ onDrop, accept: { "image/*": [] } });

  function handleUploadClick() {
    if (!activeCategory || activeCategory.id === ALL_VIEW.id) {
      toast.error("Pick (or create) a folder first, then upload into it");
      return;
    }
    openFilePicker();
  }

  const onScanDrop = useCallback((files) => {
    const file = files[0];
    if (file) setScanImage(Object.assign(file, { preview: URL.createObjectURL(file) }));
  }, []);
  const { getRootProps: getScanRootProps, getInputProps: getScanInputProps } = useDropzone({
    onDrop: onScanDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  function runFaceScan() {
    if (!scanImage) return toast.error("Upload a selfie to scan with first!");
    setIsScanning(true);
    toast.loading("Scanning every photo in this event...", { id: "orgscan" });
    setTimeout(() => {
      setIsScanning(false);
      setScanResults(images);
      setScanActive(true);
      setSelected(new Set());
      setScanOpen(false);
      toast.success(
        images.length > 0 ? `Found ${images.length} matching photo${images.length > 1 ? "s" : ""}` : "No photos uploaded yet",
        { id: "orgscan" }
      );
    }, 1500);
  }

  function clearScan() {
    setScanActive(false);
    setScanResults([]);
    setScanImage(null);
    setSelected(new Set());
  }

  const filteredImages = useMemo(() => {
    if (!activeCategory) return [];
    if (activeCategory.id === ALL_VIEW.id) return images;
    return images.filter((img) => img.categoryId === activeCategory.id);
  }, [images, activeCategory]);

  // What's actually on screen: scan results take over the gallery until
  // cleared, otherwise it's whatever folder (or "All photos") is active.
  const displayImages = scanActive ? scanResults : filteredImages;
  const displayTitle = scanActive ? "Face scan results" : activeCategory?.name || "";

  const allSelected = displayImages.length > 0 && selected.size === displayImages.length;

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(displayImages.map((p) => p.id)));
  }

  async function handleDownloadZip() {
    const photos = displayImages.filter((p) => selected.has(p.id));
    if (!photos.length) return;
    setDownloading(true);
    const zipLabel = `${event.name}-${scanActive ? "scan-results" : activeCategory?.name || "photos"}`;
    const result = await downloadPhotosAsZip(photos, zipLabel);
    setDownloading(false);
    if (result.ok) {
      toast.success(`Zipped ${photos.length - (result.failed || 0)} photo${photos.length > 1 ? "s" : ""}`);
    } else {
      toast.error("Couldn't build the zip — try again");
    }
  }

  const storageMB = event ? getEventStorageUsedMB(event.id) : 0;
  const storageCapMB = event ? event.plan.storageCapGB * 1024 : 0;
  const storagePct = storageCapMB ? Math.min(100, (storageMB / storageCapMB) * 100) : 0;
  const expired = event ? isEventExpired(event) : false;
  const remaining = event ? daysRemaining(event) : 0;

  const handleDeletePhoto = useCallback(
    (photoId) => {
      const updated = deleteEventPhoto(event.id, photoId);
      setImages(updated);
      setSelected((prev) => {
        if (!prev.has(photoId)) return prev;
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    },
    [event]
  );

  function handleDeleteSelected() {
    const ids = displayImages.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} photo${ids.length > 1 ? "s" : ""}? This can't be undone.`)) return;

    setDeleting(true);
    let updated = images;
    for (const id of ids) updated = deleteEventPhoto(event.id, id);
    setImages(updated);
    setScanResults((prev) => prev.filter((p) => !ids.includes(p.id)));
    setSelected(new Set());
    setDeleting(false);
    toast.success(`Deleted ${ids.length} photo${ids.length > 1 ? "s" : ""}`);
  }

  function handleDeleteEvent() {
    deleteEvent(event.id);
    toast.success(`"${event.name}" deleted`);
    navigate("/organiser/dashboard");
  }

  if (!event) {
    return (
      <div className="h-screen flex flex-col items-center justify-center pt-16 text-center px-6 bg-[#fffcfc] dark:bg-gray-950 text-gray-900 dark:text-white">
        <h1 className="text-2xl font-black italic tracking-tighter mb-3">Event not found</h1>
        <Link to="/organiser/dashboard" className="text-pink-500 font-bold text-xs uppercase tracking-widest">
          ← Back to your events
        </Link>
      </div>
    );
  }

  return (
    <div className={`h-screen overflow-hidden flex flex-col pt-16 transition-all duration-300 ${darkMode ? 'bg-gray-950 text-white' : 'bg-[#fffcfc] text-gray-900'}`}>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #db2777; border-radius: 10px; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #db2777 transparent; }
      `}</style>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={currentIndex}
        slides={displayImages.map(img => ({ src: img.src }))}
        plugins={[Fullscreen]}
      />

      {/* FIXED TOP HEADER */}
      <header className="flex-none pt-4 pb-3 px-8 max-w-[1600px] w-full mx-auto flex flex-col gap-2">
        <Link
          to="/organiser/dashboard"
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-pink-500 transition w-fit"
        >
          <ArrowLeft size={12} /> All events
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-pink-500 font-black text-[9px] uppercase tracking-[0.35em] mb-1 flex items-center gap-1.5">
              <Sparkles size={10} /> EventVault · Organiser
            </p>
            <h1 className="text-3xl font-black italic tracking-tighter leading-none">{event.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedPlan(event.plan.id);
                setPlanOpen(true);
              }}
              className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition ${
                expired
                  ? "border-red-200 text-red-500 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20"
                  : remaining <= 7
                  ? "border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20"
                  : "border-gray-100 dark:border-gray-800 text-gray-500 hover:border-pink-200"
              }`}
            >
              {event.plan.name} · {expired ? "Expired" : `${remaining}d left`}
            </button>
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-pink-300 dark:hover:border-pink-500/40 transition"
            >
              <Upload size={13} className="text-pink-500" /> Upload
            </button>
            <button
              onClick={() => setScanOpen(true)}
              className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-pink-300 dark:hover:border-pink-500/40 transition"
            >
              <ScanFace size={13} className="text-pink-500" /> Scan faces
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 bg-gray-900 dark:bg-pink-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition"
            >
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden px-8 pb-8 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT PANEL */}
        <div className="lg:col-span-4 xl:col-span-3 h-full">
          <div className={`flex flex-col h-full rounded-[2.5rem] shadow-2xl border transition-all ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-white'}`}>

            <div className="p-6 flex-none">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Folders</h2>
              <div className="flex gap-2">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  placeholder="New folder..."
                  className="flex-1 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-2xl text-sm outline-none border-2 border-transparent focus:border-pink-200 transition-all"
                />
                <button onClick={addCategory} className="bg-pink-500 text-white p-3.5 rounded-2xl hover:bg-pink-600 shadow-lg active:scale-90 transition-all">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
              {/* Admin-style "everything at once" view, always first */}
              <div
                onClick={() => { setActiveCategory(ALL_VIEW); clearScan(); }}
                className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2 border-dashed ${
                  !scanActive && activeCategory?.id === ALL_VIEW.id
                    ? 'bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-200'
                    : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="font-bold text-sm flex items-center gap-2"><Layers size={14} /> All photos</span>
                <span className="text-xs opacity-70">{images.length}</span>
              </div>

              {event.categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat); clearScan(); }}
                  className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                    !scanActive && activeCategory?.id === cat.id ? 'bg-pink-500 text-white shadow-md shadow-pink-200' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="font-bold text-sm truncate">{cat.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeCategory(cat); }} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all">
                    <X size={14} />
                  </button>
                </div>
              ))}

              {event.categories.length === 0 && (
                <p className="text-[11px] text-gray-400 px-2 py-4 leading-relaxed">
                  Create a folder above, then drop photos into it below.
                </p>
              )}
            </div>

            <div className="p-6 flex-none bg-gray-50/50 dark:bg-gray-800/20 rounded-b-[2.5rem]">
              <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-[2rem] text-center transition-all ${activeCategory && activeCategory.id !== ALL_VIEW.id ? 'border-pink-200 hover:border-pink-500 bg-white dark:bg-gray-800 cursor-pointer' : 'opacity-30'}`}>
                <input {...getInputProps()} disabled={!activeCategory || activeCategory.id === ALL_VIEW.id} />
                {isUploading ? (
                  <div className="w-6 h-6 mx-auto border-2 border-pink-500 border-t-transparent animate-spin rounded-full mb-2" />
                ) : (
                  <CloudUpload className="mx-auto text-pink-500 mb-2" size={24} />
                )}
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">
                  {activeCategory && activeCategory.id !== ALL_VIEW.id ? `Add to ${activeCategory.name}` : "Select a folder to upload"}
                </p>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                  <span>Storage</span>
                  <span>{storageMB.toFixed(0)}MB / {event.plan.storageCapGB}GB</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${storagePct > 90 ? "bg-red-500" : "bg-pink-500"}`}
                    style={{ width: `${storagePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Viewport Scrollable */}
        <div className="lg:col-span-8 xl:col-span-9 h-full overflow-y-auto custom-scrollbar pr-2">
          {activeCategory ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-4 flex justify-between items-center border-b pb-3 dark:border-gray-800 sticky top-0 bg-[#fffcfc] dark:bg-gray-950 z-10">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter dark:text-white leading-none flex items-center gap-2">
                    {scanActive && <ScanFace size={18} className="text-pink-500" />}
                    {displayTitle}
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {displayImages.length} item{displayImages.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {scanActive && (
                  <button
                    onClick={clearScan}
                    className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition"
                  >
                    <RefreshCw size={12} /> Back to folders
                  </button>
                )}
              </div>

              {displayImages.length > 0 ? (
                <>
                  <PhotoSelectionBar
                    total={displayImages.length}
                    selectedCount={selected.size}
                    allSelected={allSelected}
                    onToggleAll={toggleAll}
                    onDownloadZip={handleDownloadZip}
                    onDeleteSelected={handleDeleteSelected}
                    onClearSelection={() => setSelected(new Set())}
                    downloading={downloading}
                    deleting={deleting}
                  />
                  <Masonry breakpointCols={{default: 2, 1100: 2, 700: 1}} className="flex -ml-6 w-auto" columnClassName="pl-6">
                    {displayImages.map((img, i) => (
                      <div key={img.id} className="relative group rounded-[2.5rem] overflow-hidden mb-6 shadow-2xl border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-900">
                        <img
                          src={img.src}
                          alt={img.name}
                          className="w-full h-auto object-cover cursor-zoom-in group-hover:scale-110 transition-transform duration-700"
                          onClick={() => { setCurrentIndex(i); setOpen(true); }}
                        />
                        <SelectToggle selected={selected.has(img.id)} onToggle={() => toggleOne(img.id)} />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-white">
                          {img.sizeMB} MB
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-6 flex items-end justify-between pointer-events-none">
                           <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest">{img.categoryName}</span>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeletePhoto(img.id);
                             }}
                             className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all shadow-lg active:scale-90 pointer-events-auto"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                  </Masonry>
                </>
              ) : (
                <div className="min-h-[55vh] mt-6 flex flex-col items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-[4rem] border-4 border-dashed border-gray-100 dark:border-gray-800">
                  <ImageIcon size={60} className="text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-5">
                    {scanActive ? "No photos to scan yet" : "Empty Folder"}
                  </p>
                  {!scanActive && (
                    <button
                      onClick={handleUploadClick}
                      className="flex items-center gap-1.5 bg-pink-500 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-600 transition active:scale-95"
                    >
                      <Upload size={13} /> Upload photos
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-12 bg-white dark:bg-gray-900 rounded-[5rem] shadow-inner">
               <div>
                  <FolderPlus size={100} className="mx-auto text-gray-100 dark:text-gray-800 mb-8" />
                  <h2 className="text-4xl font-black text-gray-300 uppercase tracking-tighter italic">Select Folder</h2>
                  <p className="text-gray-400 mt-4 text-sm font-medium">
                    {event.categories.length === 0 ? "Create your first folder on the left to start uploading." : "Choose a folder from the left sidebar."}
                  </p>
               </div>
            </div>
          )}
        </div>
      </main>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} eyebrow="Share access" title={event.name} maxWidth="max-w-xl">
        <EventAccessPanel event={event} onEventChange={refreshEvent} />
      </Modal>

      <Modal open={planOpen} onClose={() => setPlanOpen(false)} eyebrow="Cloud storage" title="Manage plan" maxWidth="max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-black/20 rounded-2xl px-5 py-4">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Currently used</span>
            <span className="font-black">{storageMB.toFixed(1)}MB of {event.plan.storageCapGB}GB · {expired ? "expired" : `${remaining} days left`}</span>
          </div>
          <PlanPicker selectedId={selectedPlan} onSelect={setSelectedPlan} />
          <button
            onClick={() => {
              const updated = upgradeEventPlan(event.id, selectedPlan);
              setEvent(updated);
              toast.success(`Now on the ${updated.plan.name} plan`);
              setPlanOpen(false);
            }}
            disabled={selectedPlan === event.plan.id}
            className="w-full bg-gradient-to-r from-pink-600 to-rose-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition disabled:opacity-30"
          >
            {selectedPlan === event.plan.id ? "This is your current plan" : "Confirm plan change"}
          </button>
          <p className="text-[11px] text-gray-400 text-center">
            Prototype note: this is a mock purchase — a real payment gateway plugs in here later.
          </p>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Danger zone
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Deletes this event, its folders and every photo. Guests lose access immediately.</p>
            </div>
            <button
              onClick={() => { setPlanOpen(false); setDeleteEventOpen(true); }}
              className="shrink-0 flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 text-red-500 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition"
            >
              <Trash2 size={13} /> Delete event
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteEventOpen} onClose={() => setDeleteEventOpen(false)} eyebrow="This can't be undone" title={`Delete "${event.name}"?`} maxWidth="max-w-md">
        <div className="space-y-5">
          <p className="text-sm text-gray-400 leading-relaxed">
            This permanently removes the event, every folder, and every photo inside it. The guest and
            admin links stop working immediately.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteEventOpen(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-80 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEvent}
              className="flex-1 bg-red-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition"
            >
              Yes, delete it
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={scanOpen} onClose={() => setScanOpen(false)} eyebrow="AI face match" title="Scan for a face" maxWidth="max-w-md">
        <div className="space-y-5">
          <p className="text-xs text-gray-400 leading-relaxed">
            Upload a selfie to pull up every photo that person appears in across the whole event —
            the same tool guests use, available to you too.
          </p>

          <div {...getScanRootProps()} className="border-2 border-dashed rounded-[2rem] p-6 text-center transition-all border-pink-200 hover:border-pink-500 bg-gray-50 dark:bg-black/20 cursor-pointer">
            <input {...getScanInputProps()} />
            {scanImage ? (
              <div className="relative w-24 h-24 mx-auto rounded-2xl overflow-hidden">
                <img src={scanImage.preview} className="w-full h-full object-cover" alt="Selfie to scan with" />
              </div>
            ) : (
              <>
                <ScanFace className="mx-auto text-pink-500 mb-2" size={26} />
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Drop a selfie here</p>
              </>
            )}
          </div>

          <button
            onClick={runFaceScan}
            disabled={isScanning || !scanImage}
            className="w-full bg-gradient-to-r from-pink-600 to-rose-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-30"
          >
            {isScanning ? <RefreshCw className="animate-spin" size={15} /> : <ScanFace size={15} />}
            {isScanning ? "Scanning…" : "Scan every photo"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
