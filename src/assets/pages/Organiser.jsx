import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, User, AtSign, Lock, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "./Layout";
import { AuthInput } from "./AuthInput";
import { signupOrganiser, loginOrganiser } from "../lib/store";

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function Organiser() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  function handleChange(e) {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleMode() {
    setIsSignup((s) => !s);
    setError("");
    setForm({ name: "", username: "", password: "", confirm: "" });
  }

  function submitHandler(e) {
    e.preventDefault();
    setError("");

    if (isSignup) {
      if (form.password !== form.confirm) {
        setError("Passwords do not match.");
        return;
      }
      const { error: err } = signupOrganiser(form);
      if (err) return setError(err);
      navigate("/organiser/dashboard");
    } else {
      const { error: err } = loginOrganiser(form);
      if (err) return setError(err);
      navigate("/organiser/dashboard");
    }
  }

  return (
    <Layout>
      <div style={{ perspective: 1200 }} className="relative">
        {!reduceMotion && (
          <motion.div
            key={`flash-${isSignup}`}
            initial={{ opacity: 0.75 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="pointer-events-none absolute -inset-2 z-20 rounded-2xl bg-[#FFFDF9] dark:bg-[#EFE9DD]"
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={isSignup ? "signup" : "login"}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-[9px] uppercase tracking-[0.3em] text-[#B23B32] dark:text-[#D98A3D] mb-1"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Organiser access
            </motion.p>
            <h2
              className="italic tracking-tight text-2xl mb-4 text-[#17140F] dark:text-[#EFE9DD]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
            >
              {isSignup ? "Set up your account" : "Welcome back"}
            </h2>

            <motion.form
              onSubmit={submitHandler}
              className="space-y-2.5"
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.07, delayChildren: 0.15 }}
            >
              {isSignup && (
                <motion.div variants={fieldVariants}>
                  <AuthInput
                    icon={User}
                    name="name"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </motion.div>
              )}

              <motion.div variants={fieldVariants}>
                <AuthInput
                  icon={AtSign}
                  name="username"
                  placeholder="Username"
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

              {isSignup && (
                <motion.div variants={fieldVariants}>
                  <AuthInput
                    icon={ShieldCheck}
                    isPassword
                    name="confirm"
                    placeholder="Confirm Password"
                    value={form.confirm}
                    onChange={handleChange}
                    required
                  />
                </motion.div>
              )}

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
                {isSignup ? "Create account" : "Login"}
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
              </motion.button>
            </motion.form>

            <button
              onClick={toggleMode}
              className="w-full mt-3 text-center text-xs font-bold text-[#17140F]/40 dark:text-[#EFE9DD]/40 hover:text-[#B23B32] dark:hover:text-[#D98A3D] transition-colors"
            >
              {isSignup ? "Already have an account? Login" : "New organiser? Sign up here"}
            </button>

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

            <Link to="/login">
              <button className="w-full justify-center flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#17140F]/40 dark:text-[#EFE9DD]/40 hover:text-[#17140F] dark:hover:text-[#EFE9DD] transition-colors">
                Looking for your own photos? <span className="text-[#B23B32] dark:text-[#D98A3D]">Guest login</span>
              </button>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
