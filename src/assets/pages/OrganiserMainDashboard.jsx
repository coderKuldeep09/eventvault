import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar,
  Image as ImageIcon,
  FolderOpen,
  Share2,
  ArrowUpRight,
  Sparkles,
  PartyPopper,
  Music,
  Briefcase,
  Users2,
  CalendarPlus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getSession,
  getOrganiserById,
  getEventsByOrganiser,
  getEventPhotos,
  getEventStorageUsedMB,
  isEventExpired,
  daysRemaining,
  guestLinkFor,
  deleteEvent,
} from "../lib/store";
import { CreateEventModal } from "./CreateEventModal";
import { EventAccessPanel } from "./EventAccessPanel";
import { Modal } from "./Modal";

const TYPE_ICON = {
  Wedding: Sparkles,
  Birthday: PartyPopper,
  Concert: Music,
  Corporate: Briefcase,
  Reunion: Users2,
};

function EventCard({ event, onManage, onShare, onDelete }) {
  const Icon = TYPE_ICON[event.type] || Sparkles;
  const expired = isEventExpired(event);
  const remaining = daysRemaining(event);
  const photoCount = getEventPhotos(event.id).length;
  const storageMB = getEventStorageUsedMB(event.id);

  function copyLink(e) {
    e.stopPropagation();
    navigator.clipboard
      .writeText(guestLinkFor(event))
      .then(() => toast.success("Guest link copied"))
      .catch(() => toast.error("Couldn't copy — copy it manually"));
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      className="group flex flex-col bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="w-11 h-11 rounded-2xl bg-pink-500/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-pink-500" />
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
              expired
                ? "bg-red-50 text-red-500 dark:bg-red-500/10"
                : remaining <= 7
                ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10"
                : "bg-gray-50 text-gray-400 dark:bg-gray-800"
            }`}
          >
            {expired ? "Expired" : `${remaining}d left`}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete event"
            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <h3 className="font-black italic tracking-tighter text-xl leading-tight mb-1 text-gray-900 dark:text-white">
        {event.name}
      </h3>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-1.5">
        {event.type}
        {event.date && (
          <>
            <span className="text-gray-200 dark:text-gray-700">·</span>
            <Calendar size={10} /> {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </>
        )}
      </p>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-gray-50 dark:bg-black/20 rounded-xl py-2.5 text-center">
          <p className="text-sm font-black text-gray-900 dark:text-white">{event.categories.length}</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Folders</p>
        </div>
        <div className="bg-gray-50 dark:bg-black/20 rounded-xl py-2.5 text-center">
          <p className="text-sm font-black text-gray-900 dark:text-white">{photoCount}</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Photos</p>
        </div>
        <div className="bg-gray-50 dark:bg-black/20 rounded-xl py-2.5 text-center">
          <p className="text-sm font-black text-gray-900 dark:text-white">{event.plan.name}</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">
            {storageMB > 0 ? `${storageMB.toFixed(0)}MB used` : `of ${event.plan.storageCapGB}GB`}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={onManage}
          className="flex-1 bg-gray-900 dark:bg-pink-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition"
        >
          <FolderOpen size={13} /> Manage
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          title="Share guest access"
          className="w-11 h-11 shrink-0 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 flex items-center justify-center hover:text-pink-500 active:scale-95 transition"
        >
          <Share2 size={15} />
        </button>
        <button
          onClick={copyLink}
          title="Copy guest link"
          className="w-11 h-11 shrink-0 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 flex items-center justify-center hover:text-pink-500 active:scale-95 transition"
        >
          <ArrowUpRight size={15} />
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6 bg-white dark:bg-gray-900 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem]">
      <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mb-6">
        <CalendarPlus className="w-9 h-9 text-pink-500" />
      </div>
      <h2 className="font-black italic tracking-tighter text-2xl mb-2 text-gray-900 dark:text-white">
        No events yet
      </h2>
      <p className="text-gray-400 text-sm max-w-xs mb-7 leading-relaxed">
        Create your first event to get a unique guest link, QR code, and a place to upload photos.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white px-6 py-3.5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition shadow-lg shadow-pink-500/20"
      >
        <Plus size={16} /> Create an event
      </button>
    </div>
  );
}

export default function OrganiserMainDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  // getOrganiserById re-reads localStorage and hands back a brand new
  // object every call — fine for rendering, but deriving it fresh on
  // every render would make anything depending on it (below) think it
  // changed every time, and re-run forever. Keying off the plain ID
  // string (which only changes if a different organiser actually logs
  // in) keeps this stable across re-renders.
  const organiserId = session?.organiserId || null;
  const organiser = useMemo(() => (organiserId ? getOrganiserById(organiserId) : null), [organiserId]);

  const [events, setEvents] = useState(() => (organiserId ? getEventsByOrganiser(organiserId) : []));
  const [createOpen, setCreateOpen] = useState(false);
  const [shareEvent, setShareEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const refreshEvents = useCallback(() => {
    if (organiserId) setEvents(getEventsByOrganiser(organiserId));
  }, [organiserId]);

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteEvent(deleteTarget.id);
    toast.success(`"${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
    refreshEvents();
  }

  if (!organiser) return null; // ProtectedRoute redirects before this can render

  const firstName = organiser.name.split(" ")[0];

  return (
    <div className="min-h-screen pt-16 pb-20 bg-[#fffcfc] dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
      <header className="max-w-6xl mx-auto px-6 md:px-10 pt-10 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-pink-500 mb-2">
            Organiser dashboard
          </p>
          <h1 className="font-black italic tracking-tighter text-4xl md:text-5xl leading-none">
            Hii, {firstName} <span className="not-italic">👋</span>
          </h1>
          <p className="text-gray-400 text-sm mt-3 max-w-md">
            {events.length === 0
              ? "Create your first event to get a guest link and start uploading."
              : `${events.length} event${events.length > 1 ? "s" : ""} · each has its own guests, photos, and access link.`}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setCreateOpen(true)}
          className="shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white px-6 py-3.5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition shadow-lg shadow-pink-500/20"
        >
          <Plus size={16} /> New event
        </motion.button>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10">
        {events.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onManage={() => navigate(`/organiser/event/${event.slug}`)}
                  onShare={() => setShareEvent(event)}
                  onDelete={() => setDeleteTarget(event)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        organiserId={organiser.id}
        onCreated={refreshEvents}
      />

      <Modal
        open={!!shareEvent}
        onClose={() => setShareEvent(null)}
        eyebrow="Share access"
        title={shareEvent?.name}
        maxWidth="max-w-xl"
      >
        {shareEvent && <EventAccessPanel event={shareEvent} onEventChange={refreshEvents} />}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        eyebrow="This can't be undone"
        title={`Delete "${deleteTarget?.name}"?`}
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-400 leading-relaxed flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            This permanently removes the event, every folder, and every photo inside it. The guest and
            admin links stop working immediately.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-80 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 bg-red-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition"
            >
              Yes, delete it
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
