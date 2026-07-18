import { TypeAnimation } from "react-type-animation";
import { motion, useReducedMotion } from "framer-motion";
import { Aperture, Sparkles } from "lucide-react";

export function Layout({ children, wide = false }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#F6F3EC] dark:bg-[#17140F] font-sans transition-colors duration-500">
      {/* font load for the two accent typefaces used on this page */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,600&family=Space+Mono:wght@400;700&display=swap');
      `}</style>

      {/* paper grain */}
      <div
        className="pointer-events-none absolute inset-0 text-[#17140F] dark:text-[#EFE9DD] opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden="true"
      />

      {/* safelight glow — now drifting gently instead of sitting still */}
      <motion.div
        className="pointer-events-none absolute -top-32 -left-24 w-[26rem] h-[26rem] bg-[#D98A3D]/10 dark:bg-[#D98A3D]/20 rounded-full blur-3xl"
        animate={reduceMotion ? {} : { x: [0, 20, 0], y: [0, 16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-32 -right-24 w-[26rem] h-[26rem] bg-[#B23B32]/10 dark:bg-[#B23B32]/20 rounded-full blur-3xl"
        animate={reduceMotion ? {} : { x: [0, -18, 0], y: [0, -14, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* faint floating sparkles scattered around the card — the "AI magic" of finding your face */}
      {!reduceMotion &&
        [
          { top: "18%", left: "12%", delay: 0, size: 14 },
          { top: "70%", left: "85%", delay: 1.2, size: 12 },
          { top: "80%", left: "10%", delay: 2.1, size: 10 },
          { top: "14%", left: "88%", delay: 0.7, size: 11 },
        ].map((s, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute text-[#D98A3D]/50 dark:text-[#D98A3D]/60"
            style={{ top: s.top, left: s.left }}
            animate={{ opacity: [0.15, 0.7, 0.15], y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
          >
            <Sparkles size={s.size} />
          </motion.div>
        ))}

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-6 pb-8 pt-24">
        {/* THE CARD — one ticket-like panel that holds both the brand identity
            and the form. No stacked sections, no split columns: just one page. */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative w-full ${wide ? "max-w-xl" : "max-w-sm"} rounded-[1.75rem] bg-[#FFFDF9] dark:bg-[#1C1812] border border-[#17140F]/10 dark:border-[#EFE9DD]/10 shadow-2xl shadow-[#B23B32]/5`}
        >
          {/* thin accent hairline along the top edge, gently breathing */}
          <motion.div
            className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#D98A3D]/60 to-transparent"
            animate={reduceMotion ? {} : { opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* brand block */}
          <div className="flex flex-col items-center text-center gap-1.5 pt-8 px-7 pb-5">
            <div className="relative w-14 h-14 flex items-center justify-center mb-1">
              {/* outer breathing glow */}
              {!reduceMotion && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D98A3D] to-[#B23B32]"
                  animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.3, 0.08, 0.3] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              {/* rotating dashed focus-ring, like a lens locking on */}
              {!reduceMotion && (
                <motion.span
                  className="absolute inset-0 rounded-full border border-dashed border-[#B23B32]/40 dark:border-[#D98A3D]/50"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                />
              )}
              <motion.div
                initial={{ scale: 0.6, rotate: -30, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D98A3D] to-[#B23B32] flex items-center justify-center shadow-lg shadow-[#B23B32]/25"
              >
                <Aperture className="w-5 h-5 text-white" strokeWidth={2.2} />
              </motion.div>
            </div>

            <h1
              className="italic tracking-tight text-3xl leading-none text-[#17140F] dark:text-[#EFE9DD]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
            >
              Event
              <span className="bg-gradient-to-r from-[#D98A3D] to-[#B23B32] bg-clip-text text-transparent">
                Vault
              </span>
            </h1>

            <TypeAnimation
              sequence={[
                "Every wedding.",
                1500,
                "Every birthday.",
                1500,
                "Every concert.",
                1500,
                "Every reunion.",
                1500,
                "Every photo, found.",
                1500,
              ]}
              speed={45}
              repeat={Infinity}
              className="text-[11px] uppercase tracking-[0.2em] text-[#17140F]/50 dark:text-[#EFE9DD]/50 h-4"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          </div>

          {/* ticket tear-line, with the little punched notches on each edge */}
          <div className="relative h-4">
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 border-t border-dashed border-[#17140F]/15 dark:border-[#EFE9DD]/15" />
            <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#F6F3EC] dark:bg-[#17140F]" />
            <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#F6F3EC] dark:bg-[#17140F]" />
          </div>

          {/* form slot */}
          <div className="px-7 pt-5 pb-8">{children}</div>
        </motion.div>

        <p
          className="mt-4 text-[9px] uppercase tracking-widest text-[#17140F]/35 dark:text-[#EFE9DD]/35 text-center"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Instant matching · Private by default · Any event size
        </p>
      </div>
    </div>
  );
}