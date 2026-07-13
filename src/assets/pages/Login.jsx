import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Lock, QrCode } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "./Layout";
import { AuthInput } from "./AuthInput";
import { resolveGuestAccess, resolveAdminAccess, setSession } from "../lib/store";

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

// One shared entry point for BOTH guests and the event's admin/owner —
// there's no separate admin-only page any more. Every guest at an event
// signs in with the same shared event ID + password (or skips this
// screen entirely via the link/QR, landing on /e/:slug directly). The
// event owner instead has their own unique admin ID + password (see the
// EventAccessPanel on the organiser side for where these come from) —
// typed into this exact same form. We just try both resolvers and route
// to wherever the credential actually belongs.
export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  function handleChange(e) {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function submitHandler(e) {
    e.preventDefault();

    const guestEvent = resolveGuestAccess(form);
    if (guestEvent) {
      navigate(`/e/${guestEvent.slug}`);
      return;
    }

    const adminEvent = resolveAdminAccess(form);
    if (adminEvent) {
      setSession({ role: "admin", eventId: adminEvent.id });
      navigate(`/admin/${adminEvent.slug}`);
      return;
    }

    setError("That ID + password didn't match anything.");
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-[9px] uppercase tracking-[0.3em] text-[#B23B32] dark:text-[#D98A3D] mb-1"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Guest &amp; admin access
        </motion.p>
        <h2
          className="italic tracking-tight text-2xl mb-4 text-[#17140F] dark:text-[#EFE9DD]"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
        >
          Find your photos
        </h2>

        <motion.form
          onSubmit={submitHandler}
          className="space-y-2.5"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.07, delayChildren: 0.15 }}
        >
          <motion.div variants={fieldVariants}>
            <AuthInput
              icon={KeyRound}
              name="username"
              placeholder="Event ID or Admin ID"
              value={form.username}
              onChange={handleChange}
              required
            />
          </motion.div>

          <motion.div variants={fieldVariants}>
            <AuthInput
              icon={Lock}
              isPassword
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold text-[#B23B32] dark:text-[#D98A3D] px-1"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            variants={fieldVariants}
            type="submit"
            className="group relative w-full overflow-hidden bg-gradient-to-r from-[#D98A3D] to-[#B23B32] text-white p-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-lg hover:shadow-[#B23B32]/20 transition active:scale-95 mt-1"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            View my photos
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>
        </motion.form>

        <p className="flex items-center gap-1.5 justify-center mt-4 text-[10px] font-bold uppercase tracking-widest text-[#17140F]/30 dark:text-[#EFE9DD]/30">
          <QrCode size={12} /> Got a link or QR instead? Just open it
        </p>
        <p className="text-center mt-2 text-[10px] font-medium text-[#17140F]/35 dark:text-[#EFE9DD]/35 leading-relaxed">
          Guests share one Event ID + password from the invite. Event owners sign in here too, with
          their own personal Admin ID instead.
        </p>

        <div className="flex items-center gap-3 my-3">
          <div className="h-px flex-1 bg-[#17140F]/10 dark:bg-[#EFE9DD]/10" />
          <span
            className="text-[9px] uppercase tracking-widest text-[#17140F]/30 dark:text-[#EFE9DD]/30"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            or
          </span>
          <div className="h-px flex-1 bg-[#17140F]/10 dark:bg-[#EFE9DD]/10" />
        </div>

        <Link to="/organiser">
          <button className="w-full justify-center flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#17140F]/40 dark:text-[#EFE9DD]/40 hover:text-[#17140F] dark:hover:text-[#EFE9DD] transition-colors">
            Organising an event? <span className="text-[#B23B32] dark:text-[#D98A3D]">Sign in here</span>
          </button>
        </Link>
      </motion.div>
    </Layout>
  );
}
