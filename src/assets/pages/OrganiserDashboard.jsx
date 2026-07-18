import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import Masonry from "react-masonry-css";
import {
  Trash2, CloudUpload, ArrowLeft, Upload, ZoomIn,
  Plus, X, FolderPlus, Image as ImageIcon, Share2, Sparkles, ScanFace, Layers, RefreshCw, AlertTriangle, CloudUpload as CloudCheck,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import toast from "react-hot-toast";

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
  const [pendingFiles, setPendingFiles] = useState([]); // files staged for upload (preview only)
  const [pendingZoomIndex, setPendingZoomIndex] = useState(null); // index of pending image to zoom
  const [uploadedZoomIndex, setUploadedZoomIndex] = useState(null); // index of uploaded image to zoom

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

  // Stage 1: files dropped/selected → store with target category for preview (NO upload yet)
  const onDrop = (files) => {
    if (!activeCategory || activeCategory.id === ALL_VIEW.id) return toast.error("Pick a specific folder first!");
    const withPreviews = files.map((f) =>
      Object.assign(f, { preview: URL.createObjectURL(f), _targetCategory: activeCategory })
    );
    setPendingFiles((prev) => [...prev, ...withPreviews]);
    toast(`${files.length} photo${files.length > 1 ? "s" : ""} staged in preview — hit Publish All to upload`, {
      icon: "👁️",
    });
  };

  // Stage 2: "Publish All" — commit ALL pending files across all folders
  // Each pending file carries a .targetCategory (set on drop); fall back to activeCategory.
  function commitUpload() {
    if (!pendingFiles.length) return;
    const count = pendingFiles.length;
    setIsUploading(true);
    setTimeout(() => {
      // Group pending by their target category (or current activeCategory)
      let updated = images;
      const byCategory = {};
      pendingFiles.forEach((f) => {
        const cat = f._targetCategory || activeCategory;
        if (!cat || cat.id === ALL_VIEW.id) return;
        if (!byCategory[cat.id]) byCategory[cat.id] = { cat, files: [] };
        byCategory[cat.id].files.push(f);
      });
      Object.values(byCategory).forEach(({ cat, files }) => {
        updated = addEventPhotos(event.id, cat, files);
      });
      setImages(updated);
      setPendingFiles([]);
      setIsUploading(false);
      toast.success(
        `☁️ ${count} photo${count > 1 ? "s" : ""} published to cloud successfully!`,
        { duration: 4000, style: { fontWeight: "800", fontSize: "13px" } }
      );
    }, 800);
  }

  const { getRootProps, getInputProps, open: openFilePicker } = useDropzone({ onDrop, accept: { "image/*": [] } });

  // Top-right button: open file picker (staging only)
  function handleUploadClick() {
    if (!activeCategory || activeCategory.id === ALL_VIEW.id) {
      toast.error("Pick (or create) a folder first, then add photos");
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

      {/* Zoom popup for uploaded images — same style as pending preview popup */}
      {uploadedZoomIndex !== null && displayImages[uploadedZoomIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          {/* Clickable scrim to close */}
          <div className="absolute inset-0" onClick={() => setUploadedZoomIndex(null)} />

          {/* Floating zoomed card */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.45)] border-4 border-pink-400"
            style={{
              width: "min(640px, 92vw)",
              animation: "zoomIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={displayImages[uploadedZoomIndex].src}
              alt={displayImages[uploadedZoomIndex].name}
              className="w-full object-contain"
              style={{ maxHeight: "75vh", background: "#111" }}
            />
            {/* Bottom strip — file info + navigation */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 py-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-block bg-pink-500/90 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1">
                  ☁️ Uploaded
                </span>
                <p className="text-white/80 text-[10px] font-bold truncate">{displayImages[uploadedZoomIndex].name}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {uploadedZoomIndex > 0 && (
                  <button onClick={() => setUploadedZoomIndex(i => i - 1)} className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition text-sm font-bold">‹</button>
                )}
                {uploadedZoomIndex < displayImages.length - 1 && (
                  <button onClick={() => setUploadedZoomIndex(i => i + 1)} className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition text-sm font-bold">›</button>
                )}
                <button onClick={() => setUploadedZoomIndex(null)} className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition">
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hover-style zoom for pending preview images — bg content stays visible */}
      {pendingZoomIndex !== null && pendingFiles[pendingZoomIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
        >
          {/* Clickable scrim to close */}
          <div className="absolute inset-0 pointer-events-auto" onClick={() => setPendingZoomIndex(null)} />

          {/* Floating zoomed card — like a hover zoom but triggered by button */}
          <div
            className="relative pointer-events-auto rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.35)] border-4 border-amber-300"
            style={{
              width: "min(560px, 90vw)",
              animation: "zoomIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes zoomIn {
                from { transform: scale(0.85); opacity: 0; }
                to   { transform: scale(1);    opacity: 1; }
              }
            `}</style>
            <img
              src={pendingFiles[pendingZoomIndex].preview}
              alt={pendingFiles[pendingZoomIndex].name}
              className="w-full object-contain"
              style={{ maxHeight: "70vh", background: "#111" }}
            />
            {/* Bottom strip — Preview badge + actions */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 py-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-block bg-amber-400/90 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1">
                  👁️ Preview Only — Not Uploaded
                </span>
                <p className="text-white/80 text-[10px] font-bold truncate">{pendingFiles[pendingZoomIndex].name}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {pendingZoomIndex > 0 && (
                  <button onClick={() => setPendingZoomIndex(i => i - 1)} className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition text-sm font-bold">‹</button>
                )}
                {pendingZoomIndex < pendingFiles.length - 1 && (
                  <button onClick={() => setPendingZoomIndex(i => i + 1)} className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition text-sm font-bold">›</button>
                )}
                <button
                  onClick={() => { setPendingFiles(prev => prev.filter((_, idx) => idx !== pendingZoomIndex)); setPendingZoomIndex(null); }}
                  className="w-7 h-7 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition"
                >
                  <Trash2 size={12} />
                </button>
                <button onClick={() => setPendingZoomIndex(null)} className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition">
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <h1 className="text-3xl font-black italic tracking-tighter leading-none flex items-center gap-3">
              {event.numericId && (
                <span className="text-lg text-pink-500 font-bold bg-pink-500/10 px-2 py-0.5 rounded-xl border border-pink-500/20">
                  #{event.numericId}
                </span>
              )}
              {event.name}
            </h1>
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
            {/* Add photos to staging */}
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-pink-300 dark:hover:border-pink-500/40 transition"
            >
              <Upload size={13} className="text-pink-500" /> Add Photos
            </button>
            {/* Publish All — final cloud upload of every staged photo */}
            {pendingFiles.length > 0 && (
              <button
                onClick={commitUpload}
                disabled={isUploading}
                className="flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition shadow-lg shadow-pink-500/30 disabled:opacity-50 animate-pulse"
              >
                {isUploading ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <CloudUpload size={13} />
                )}
                {isUploading ? "Uploading…" : `Publish All (${pendingFiles.length})`}
              </button>
            )}
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
                {pendingFiles.length > 0 && (
                  <p className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-pink-500">
                    {pendingFiles.length} staged · preview on right →
                  </p>
                )}
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

              {/* ── Pending preview banner ── */}
              {pendingFiles.length > 0 && (
                <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-lg">👁️</span>
                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      {pendingFiles.length} photo{pendingFiles.length > 1 ? "s" : ""} in preview — not uploaded yet
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPendingFiles([])}
                      className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition"
                    >
                      Discard
                    </button>
                    <button
                      onClick={commitUpload}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 bg-pink-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-600 transition disabled:opacity-50"
                    >
                      {isUploading ? <span className="w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Upload size={11} />}
                      Upload now
                    </button>
                  </div>
                </div>
              )}

              {(displayImages.length > 0 || pendingFiles.length > 0) ? (
                <>
                  {displayImages.length > 0 && (
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
                  )}
                  <Masonry breakpointCols={{default: 3, 1100: 3, 700: 2}} className="flex -ml-4 w-auto" columnClassName="pl-4">
                    {/* Uploaded images */}
                    {displayImages.map((img, i) => (
                      <div key={img.id} className="relative group rounded-2xl overflow-hidden mb-4 shadow-lg border-2 border-white dark:border-gray-800 bg-white dark:bg-gray-900">
                        <img
                          src={img.src}
                          alt={img.name}
                          className="w-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-500"
                          style={{ maxHeight: "200px", objectFit: "cover" }}
                          onClick={() => setUploadedZoomIndex(i)}
                        />
                        <SelectToggle selected={selected.has(img.id)} onToggle={() => toggleOne(img.id)} />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[9px] font-black text-white">
                          {img.sizeMB} MB
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-4 flex items-end justify-between pointer-events-none">
                           <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest">{img.categoryName}</span>
                           <button
                             onClick={(e) => { e.stopPropagation(); handleDeletePhoto(img.id); }}
                             className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg active:scale-90 pointer-events-auto"
                           >
                              <Trash2 size={13} />
                           </button>
                        </div>
                      </div>
                    ))}
                    {/* Pending preview images — not uploaded yet */}
                    {pendingFiles.map((f, i) => (
                      <div key={`pending-${i}`} className="relative group rounded-2xl overflow-hidden mb-4 shadow-lg border-2 border-amber-300 dark:border-amber-500/40 bg-white dark:bg-gray-900">
                        <img
                          src={f.preview}
                          alt={f.name}
                          className="w-full object-cover"
                          style={{ maxHeight: "200px", objectFit: "cover" }}
                        />
                        {/* Top action buttons: zoom + remove */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => setPendingZoomIndex(i)}
                            className="w-7 h-7 bg-black/70 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-amber-500 transition"
                            title="Zoom preview"
                          >
                            <ZoomIn size={12} />
                          </button>
                          <button
                            onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                            className="w-7 h-7 bg-black/70 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-red-500 transition"
                            title="Remove"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        {/* Bottom: Preview Only badge + filename */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                          <span className="inline-block bg-amber-400/90 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1">👁️ Preview Only</span>
                          <p className="text-[9px] font-bold text-white/80 truncate">{f.name}</p>
                        </div>
                      </div>
                    ))}
                  </Masonry>
                </>
              ) : (
                <div className="relative min-h-[65vh] mt-6 flex flex-col items-center justify-center bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:bg-gray-900/40 rounded-[4rem] border-4 border-dashed border-gray-200 dark:border-gray-800 transition-all hover:border-pink-300 dark:hover:border-pink-500/30 hover:bg-pink-50/30 dark:hover:bg-gray-900/60 group overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <div className="w-64 h-64 bg-pink-400/5 dark:bg-pink-500/5 blur-3xl rounded-full" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 mb-6 rounded-[2rem] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-inner flex items-center justify-center border border-gray-200 dark:border-gray-700 group-hover:scale-110 transition-transform duration-500">
                      <ImageIcon size={40} className="text-gray-300 dark:text-gray-600 group-hover:text-pink-400 transition-colors duration-500" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200 uppercase tracking-tighter italic mb-2">
                      {scanActive ? "No photos to scan" : "Empty Folder"}
                    </h3>
                    
                    <p className="text-gray-400 font-medium text-xs max-w-[260px] text-center leading-relaxed mb-8">
                      {scanActive 
                        ? "We couldn't find any photos to scan in this folder right now." 
                        : "Get started by uploading some memorable photos to this folder."}
                    </p>
                    
                    {!scanActive && (
                      <button
                        onClick={handleUploadClick}
                        className="relative overflow-hidden flex items-center gap-2 bg-gray-900 dark:bg-pink-600 text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 hover:shadow-xl hover:shadow-pink-500/20 active:scale-95 transition-all"
                      >
                        <Upload size={15} className="text-pink-400 dark:text-white" /> 
                        <span>Upload photos</span>
                      </button>
                    )}
                  </div>
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
