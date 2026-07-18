import { useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import {
  Upload, Search, RefreshCw, Heart,
  ChevronDown, X, Scan, Sparkles, Camera, Maximize2, Image as ImageIcon, CalendarX2
} from "lucide-react";
import toast from "react-hot-toast";
import { getEventBySlug, getEventPhotos } from "../lib/store";
import { PhotoSelectionBar, SelectToggle } from "./PhotoSelectionBar";
import { downloadPhotosAsZip } from "../lib/downloadZip";

function EventNotFound() {
  return (
    <div className="h-screen w-full pt-16 bg-[#fffcfc] dark:bg-[#050505] text-gray-900 dark:text-white flex flex-col items-center justify-center text-center px-6">
      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
        <CalendarX2 size={32} className="text-gray-300" />
      </div>
      <h1 className="text-3xl font-black italic tracking-tighter mb-2">Event not found</h1>
      <p className="text-gray-400 text-sm max-w-xs mb-7">
        This link may have changed, or the event isn't live any more. Check the invite for the latest link, or
        enter your event ID directly.
      </p>
      <Link
        to="/login"
        className="bg-gray-950 dark:bg-pink-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest"
      >
        Enter event ID
      </Link>
    </div>
  );
}

export default function UserPage() {
  const { slug } = useParams();
  const event = useMemo(() => getEventBySlug(slug), [slug]);

  const [image, setImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [category, setCategory] = useState("All");
  const [matchedPhotos, setMatchedPhotos] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [downloading, setDownloading] = useState(false);

  const allSelected = matchedPhotos.length > 0 && selected.size === matchedPhotos.length;

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(matchedPhotos.map((p) => p.id)));
  }

  async function handleDownloadZip() {
    const photos = matchedPhotos.filter((p) => selected.has(p.id));
    if (!photos.length) return;
    setDownloading(true);
    const result = await downloadPhotosAsZip(photos, `${event.name}-my-photos`);
    setDownloading(false);
    if (result.ok) {
      toast.success(`Zipped ${photos.length - (result.failed || 0)} photo${photos.length > 1 ? "s" : ""}`);
    } else {
      toast.error("Couldn't build the zip — try again");
    }
  }

  // Real photos the organiser has uploaded for THIS event (this browser
  // session — see lib/store.js for why these aren't persisted yet).
  // Memoized so the reference only changes when the event itself does,
  // not on every render (matters for the useCallback below).
  const allPhotos = useMemo(() => (event ? getEventPhotos(event.id) : []), [event]);

  const handleSearch = useCallback(
    (categoryOverride) => {
      if (!image) return toast.error("Please upload your face first!");

      const activeCategory = categoryOverride ?? category;
      setIsScanning(true);
      toast.loading("Scanning event album...", { id: "search" });

      setTimeout(() => {
        setIsScanning(false);

        const filtered =
          activeCategory === "All" ? allPhotos : allPhotos.filter((img) => img.categoryName === activeCategory);

        setMatchedPhotos(filtered);
        setSelected(new Set());

        if (filtered.length > 0) {
          toast.success(`Found ${filtered.length} photo${filtered.length > 1 ? "s" : ""}!`, { id: "search" });
        } else {
          toast.error(
            allPhotos.length === 0 ? "The organiser hasn't uploaded photos yet" : `No photos found in ${activeCategory}`,
            { id: "search" }
          );
        }
      }, 1500);
    },
    [image, category, allPhotos]
  );

  // Re-filter immediately when the category changes and a search has
  // already run — driven straight from the <select>'s onChange below
  // (with the new value passed explicitly) rather than an effect, so
  // there's no stale-closure risk and no extra render/commit cycle.
  function handleCategoryChange(next) {
    setCategory(next);
    if (image && matchedPhotos.length > 0) handleSearch(next);
  }

  const openZoom = (src) => {
    setSelectedImg(src);
    setZoomOpen(true);
  };
  const closeZoom = () => {
    setZoomOpen(false);
    setSelectedImg(null);
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(Object.assign(file, { preview: URL.createObjectURL(file) }));
      setMatchedPhotos([]);
      setSelected(new Set());
      toast.success("Selfie captured! ✨");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    disabled: !event,
  });

  if (!event) return <EventNotFound />;

  return (
    <div className="h-screen w-full pt-16 bg-[#fffcfc] dark:bg-[#050505] text-gray-900 dark:text-white flex flex-col overflow-hidden transition-all duration-500 relative font-sans">

      <style>{`
        @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
        .animate-scan-line { animation: scan 2s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ec4899; border-radius: 10px; }
        .masonry-columns { column-count: 2; column-gap: 1.5rem; }
        @media (max-width: 1200px) { .masonry-columns { column-count: 2; } }
        @media (max-width: 768px) { .masonry-columns { column-count: 1; } }
        .break-inside-avoid { break-inside: avoid; }
      `}</style>

      {/* ZOOM LIGHTBOX */}
      {zoomOpen && selectedImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <button onClick={closeZoom} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all hover:rotate-90">
            <X size={40} strokeWidth={1} />
          </button>
          <img src={selectedImg} className="max-w-full max-h-[90vh] rounded-[2rem] shadow-2xl border border-white/10" alt="Zoomed" />
        </div>
      )}

      {/* HEADER */}
      <header className="flex-none pt-4 pb-4 px-10 max-w-[1800px] w-full mx-auto flex justify-between items-center z-10">
        <div>
          <div className="flex items-center gap-2 text-pink-500 font-black text-[10px] uppercase tracking-[0.5em] mb-1">
            <Sparkles size={12} className="animate-pulse" /> Find Your Moments
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter leading-none bg-gradient-to-r from-gray-900 to-pink-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            EventVault AI<span className="text-pink-500">.</span>
          </h1>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.25em] mt-2">
            Viewing <span className="text-gray-700 dark:text-gray-200">{event.name}</span>
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default text-pink-500">
          <Heart size={14} fill="currentColor" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Personalized</span>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 overflow-hidden px-10 pb-6 max-w-[1800px] w-full mx-auto grid grid-cols-12 gap-8 mt-2">

        {/* LEFT: CONTROLS */}
        <div className="col-span-12 lg:col-span-3 h-full flex flex-col gap-6 overflow-hidden pr-2 ">

          <div className="p-6 rounded-[2.5rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5 ">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 block ml-2">Moment</label>
             <div className="relative">
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full appearance-none bg-gray-50 dark:bg-black/40 border border-transparent dark:border-gray-800 py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-pink-500/20 transition-all cursor-pointer"
                >
                  <option value="All">All Moments</option>
                  {event.categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-pink-500 pointer-events-none" size={16} />
             </div>
          </div>

          <div className="flex-1 p-6 rounded-[2.5rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5 flex flex-col min-h-[300px]">
              <div className="mb-4 ml-2">
                <h3 className="text-xs font-black uppercase tracking-widest">Identify Face</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">AI Matching</p>
              </div>

              <div {...getRootProps()} className={`flex-1 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-4 text-center transition-all relative overflow-hidden ${isDragActive ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/5' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 hover:border-pink-500 cursor-pointer'}`}>
                  <input {...getInputProps()} />
                  {image ? (
                    <div className="relative w-full h-full rounded-2xl overflow-hidden group">
                        <img src={image.preview} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Your selfie" />
                        {isScanning && (
                            <div className="absolute inset-0 bg-pink-500/10 flex flex-col items-center justify-center">
                                <div className="w-full h-1 bg-pink-500 absolute top-0 animate-scan-line shadow-[0_0_15px_#ec4899]" />
                                <span className="bg-pink-500 text-white text-[8px] font-black px-2 py-1 rounded">MATCHING AI...</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-sm">
                           <Camera className="text-white" size={20} />
                        </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <Scan size={24} className="text-pink-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-tight">
                          Drop Selfie<br/>to find you
                        </p>
                    </div>
                  )}
              </div>

              <button
                onClick={() => handleSearch()}
                disabled={isScanning || !image}
                className="w-full mt-6 bg-gray-950 dark:bg-pink-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-20 transition-all shadow-xl shadow-pink-500/10 hover:shadow-pink-500/20"
              >
                {isScanning ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                {isScanning ? "Scanning..." : "Search My Photos"}
              </button>
          </div>
        </div>

        {/* RIGHT: GALLERY & DYNAMIC HEADING */}
        <div className="col-span-12 lg:col-span-9 h-full flex flex-col overflow-hidden">

          <div className="flex items-end justify-between mb-4 px-2">
            <div className="animate-in fade-in slide-in-from-left duration-500">
              <h2 className="text-4xl font-black italic tracking-tighter leading-none">
                {matchedPhotos.length > 0 ? (
                  <>{category === "All" ? "All Moments" : `${category} Gallery`}<span className="text-pink-500">.</span></>
                ) : "Your Vault"}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 italic">
                {matchedPhotos.length > 0 ? `Found ${matchedPhotos.length} Photos` : "Upload a selfie to begin the search"}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-20">
            {matchedPhotos.length > 0 ? (
              <div className="animate-in fade-in zoom-in duration-700">
                <PhotoSelectionBar
                  total={matchedPhotos.length}
                  selectedCount={selected.size}
                  allSelected={allSelected}
                  onToggleAll={toggleAll}
                  onDownloadZip={handleDownloadZip}
                  onClearSelection={() => setSelected(new Set())}
                  downloading={downloading}
                />
                <div className="masonry-columns">
                {matchedPhotos.map((img) => (
                  <div key={img.id} className="break-inside-avoid relative group rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-gray-900 shadow-xl bg-white dark:bg-gray-900 transition-all hover:translate-y-[-5px] mb-6">
                    <img
                      src={img.src}
                      className="w-full h-auto object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-700"
                      onClick={() => openZoom(img.src)}
                      alt={img.name || "Matched moment"}
                    />
                    <SelectToggle selected={selected.has(img.id)} onToggle={() => toggleOne(img.id)} />
                    <div className="absolute top-4 left-4">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/10">
                          {img.categoryName}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-6 flex items-end justify-between pointer-events-none">
                       <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Your moment</p>
                       <div className="flex gap-2 pointer-events-auto">
                          <button onClick={() => openZoom(img.src)} className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-pink-500 transition-colors">
                            <Maximize2 size={16} />
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            ) : (
              <div className="relative min-h-[65vh] flex flex-col items-center justify-center bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:bg-transparent border-4 border-dashed border-gray-200 dark:border-gray-800 rounded-[4rem] text-center p-12 transition-all hover:border-pink-300 dark:hover:border-gray-700 hover:bg-pink-50/30 dark:hover:bg-gray-900/60 group overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <div className="w-64 h-64 bg-pink-400/5 dark:bg-pink-500/5 blur-3xl rounded-full" />
                  </div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 mb-6 rounded-[2rem] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-inner flex items-center justify-center border border-gray-200 dark:border-gray-700 group-hover:scale-110 transition-transform duration-500">
                      <ImageIcon size={40} className="text-gray-300 dark:text-gray-600 group-hover:text-pink-400 transition-colors duration-500" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-800 dark:text-gray-200 uppercase italic tracking-tighter mb-3">
                      No Photos Scanned Yet
                    </h3>
                    <p className="text-gray-400 text-sm max-w-[280px] font-medium leading-relaxed">
                      Once you upload a selfie, we'll search {event.name}'s photos for you.
                    </p>
                  </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
