import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ScanFace,
  CloudUpload,
  Images,
  ShieldCheck,
  Download,
  Share2,
  Moon,
  Sparkles,
  ArrowRight,
  Check,
  PartyPopper,
  Briefcase,
  Users2,
  Music,
} from "lucide-react";

/* ---------------------------------------------------------
   Data
--------------------------------------------------------- */

const EVENT_TYPES = [
  { label: "Weddings", icon: Sparkles },
  { label: "Birthdays", icon: PartyPopper },
  { label: "Concerts", icon: Music },
  { label: "Corporate", icon: Briefcase },
  { label: "Reunions", icon: Users2 },
];

const STEPS = [
  {
    n: "01",
    icon: ScanFace,
    title: "Upload one selfie",
    body: "One clear photo of your face is all EventVault needs — no app install, no account required for guests.",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "AI scans every album",
    body: "Every photo the organiser has uploaded — from any event, any day — gets checked for a match in seconds.",
  },
  {
    n: "03",
    icon: Download,
    title: "Download your moments",
    body: "Full-resolution photos of you and your people, ready to save or share, no endless scrolling.",
  },
];

const GUEST_FEATURES = [
  { icon: ScanFace, title: "Face match, not folder search", body: "Find yourself across thousands of photos without knowing who took them." },
  { icon: Images, title: "Sorted automatically", body: "Arrivals, main event, celebration, group photos — organised without any manual tagging." },
  { icon: ShieldCheck, title: "Private by default", body: "Only people who were there can search the album — nothing is ever public." },
  { icon: Share2, title: "Share in one tap", body: "Send a match straight to a group chat instead of forwarding hundreds of stray photos." },
  { icon: Download, title: "Full-resolution downloads", body: "No watermarks, no compression — the photo you download is the photo that was uploaded." },
  { icon: Moon, title: "Easy on the eyes", body: "A light or dark theme for scrolling through galleries at any hour, at any event." },
];

/* ---------------------------------------------------------
   Signature hero visual
--------------------------------------------------------- */

function ScanShowcase() {
  const thumbs = [
    { src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=60", tag: "Concert" },
    { src: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&q=60", tag: "Party" },
    { src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=60", tag: "Wedding", match: true },
    { src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=60", tag: "Corporate" },
    { src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=60", tag: "Wedding" },
    { src: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400&q=60", tag: "Reunion" },
  ];

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative rounded-[2.5rem] border border-gray-800 bg-gray-900 shadow-2xl shadow-black/40 p-4 overflow-hidden">
        <div className="grid grid-cols-3 gap-2">
          {thumbs.map((t, i) => (
            <div
              key={i}
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden ring-1 ${
                t.match ? "ring-pink-500" : "ring-white/5"
              }`}
            >
              <img src={t.src} alt="" className="w-full h-full object-cover" loading="lazy" />
              {t.match && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4, duration: 0.35 }}
                  className="absolute inset-0 border-2 border-pink-500 rounded-2xl flex items-end justify-center pb-1.5"
                >
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-pink-500 text-white px-2 py-0.5 rounded-full">
                    <Check className="w-2.5 h-2.5" /> match
                  </span>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* scanning beam */}
        <motion.div
          className="pointer-events-none absolute left-4 right-4 h-10 rounded-md"
          style={{
            background:
              "linear-gradient(180deg, rgba(236,72,153,0) 0%, rgba(236,72,153,0.4) 50%, rgba(236,72,153,0) 100%)",
          }}
          initial={{ top: 20 }}
          animate={{ top: [20, 300, 20] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.4 }}
        className="absolute -bottom-4 -left-4 bg-white text-gray-900 rounded-2xl px-3 py-2 shadow-xl text-xs font-black uppercase tracking-wide flex items-center gap-2"
      >
        <ScanFace className="w-4 h-4 text-pink-500" />
        3 matches found
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute -top-4 -right-3 bg-gray-950 border border-gray-800 rounded-2xl px-3 py-1.5 shadow-xl text-[10px] font-black uppercase tracking-wide text-gray-300"
      >
        Scanning 2,148 photos…
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------
   Organiser dashboard mockup
--------------------------------------------------------- */

function DashboardMockup() {
  const cats = [
    { label: "Wedding", count: 892, active: true },
    { label: "Birthday", count: 341 },
    { label: "Concert", count: 214 },
    { label: "Corporate", count: 176 },
  ];

  return (
    <div className="rounded-[2.5rem] border border-gray-800 bg-gray-900 shadow-2xl shadow-black/40 p-6">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Manage events</p>
      <div className="space-y-2 mb-6">
        {cats.map((c) => (
          <div
            key={c.label}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition ${
              c.active ? "bg-pink-500 text-white shadow-md shadow-pink-500/30" : "bg-black/30 text-gray-400"
            }`}
          >
            <span>{c.label}</span>
            <span className="text-xs opacity-80">{c.count}</span>
          </div>
        ))}
      </div>
      <div className="border-2 border-dashed border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center">
        <CloudUpload className="text-pink-500 mb-2" size={22} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Drop photos to add</p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- */

export default function Landing() {
  return (
    <div className="bg-vault-light dark:bg-vault-dark text-gray-900 dark:text-white font-sans transition-colors duration-500 pt-16">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-gray-950">
        <div className="pointer-events-none absolute -top-32 -left-20 w-96 h-96 bg-pink-600/25 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-24 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-pink-400 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5" /> AI face search, any event
            </span>

            <h1 className="font-black italic tracking-tighter text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.05] text-white">
              You were there.
              <br />
              <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                Now find yourself in it.
              </span>
            </h1>

            <p className="mt-6 text-gray-400 text-lg max-w-md font-medium">
              Upload one selfie. EventVault scans every photo from every event — weddings, birthdays,
              concerts, corporate — and hands you back only the ones you're actually in.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white px-6 py-3.5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20 transition active:scale-95"
              >
                Find my photos <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/organiser"
                className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-3.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 transition"
              >
                I'm an organiser
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-gray-500 text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-pink-400" /> Private albums</span>
              <span className="flex items-center gap-1.5"><Images className="w-4 h-4 text-pink-400" /> Full resolution</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <ScanShowcase />
          </motion.div>
        </div>
      </section>

      {/* ================= EVENT TYPE STRIP ================= */}
      <section className="border-b border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {EVENT_TYPES.map((e) => (
            <span key={e.label} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              <e.icon className="w-4 h-4 text-pink-500" />
              {e.label}
            </span>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-24">
        <div className="max-w-xl mb-14">
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-pink-500">How it works</span>
          <h2 className="font-black italic tracking-tighter text-3xl md:text-4xl mt-3">
            Three steps between you and every photo you're in.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-80px" }} 
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="font-black italic text-2xl text-pink-500/40">{s.n}</span>
                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-pink-500" />
                </div>
              </div>
              <h3 className="font-black italic tracking-tighter text-xl mb-2">{s.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= GUEST FEATURES ================= */}
      <section className="bg-gray-50 dark:bg-gray-950/60 py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="max-w-xl mb-14">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-pink-500">For guests</span>
            <h2 className="font-black italic tracking-tighter text-3xl md:text-4xl mt-3">
              No more asking "who has the photos?"
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GUEST_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-60px" }} 
                transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 hover:shadow-xl hover:-translate-y-0.5 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-pink-500" />
                </div>
                <h3 className="font-black italic tracking-tighter text-lg mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ORGANISER PANEL ================= */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-24 grid md:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="order-2 md:order-1"
        >
          <DashboardMockup />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, margin: "-80px" }} 
          transition={{ duration: 0.6 }}
          className="order-1 md:order-2"
        >
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-pink-500">For organisers &amp; photographers</span>
          <h2 className="font-black italic tracking-tighter text-3xl md:text-4xl mt-3 mb-5">
            Upload once. Let the AI do the sorting.
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
            Drag and drop photos straight from your camera roll, group them into custom categories as you go,
            and let every guest search the album themselves instead of messaging you for photos one by one.
            Works the same whether you're running a wedding, a concert, or a conference.
          </p>

          <ul className="space-y-3 mb-8">
            {[
              "Bulk drag-and-drop upload, no size limits",
              "Custom categories for any kind of event",
              "Guests search the album — you don't send a thing",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-pink-500" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <Link
            to="/organiser"
            className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition active:scale-95"
          >
            <CloudUpload className="w-4 h-4" /> Start organising
          </Link>
        </motion.div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="px-6 md:px-10 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-60px" }} 
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto rounded-[2.5rem] bg-gray-950 text-white px-8 py-16 md:py-20 text-center relative overflow-hidden"
        >
          <div className="pointer-events-none absolute -top-20 left-1/4 w-72 h-72 bg-pink-600/25 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-1/4 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="font-black italic tracking-tighter text-3xl md:text-4xl mb-4">
              Your photos are already in the album.
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Upload a selfie and let EventVault find every moment you were part of — in a few seconds,
              not a few hundred scrolls.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white px-7 py-3.5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20 transition active:scale-95"
            >
              Find my photos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-gray-100 dark:border-gray-900 px-6 md:px-10 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-black italic tracking-tighter text-lg">EventVault</span>
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
            Made for the album everyone forgets to ask for. © {new Date().getFullYear()} EventVault.
          </p>
          <div className="flex gap-5 text-xs font-bold uppercase tracking-widest">
            <Link to="/login" className="hover:text-pink-500 transition">Guest login</Link>
            <Link to="/organiser" className="hover:text-pink-500 transition">Organiser</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}