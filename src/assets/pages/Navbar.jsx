import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Aperture } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeProvider";
import { getSession, clearSession } from "../lib/store";

export default function Navbar() {
  const { dark, toggleTheme } = useTheme();
  const [dateTime, setDateTime] = useState("");
  const [locationName, setLocationName] = useState("Detecting...");
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            setLocationName(
              data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.county ||
                "Unknown"
            );
          } catch {
            setLocationName("Location Error");
          }
        },
        () => setLocationName("Denied")
      );
    }

    const interval = setInterval(() => {
      const now = new Date();
      setDateTime(
        now.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "medium",
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function logout() {
    clearSession();
    navigate("/");
  }

  return (
    <nav className="fixed top-0 left-0 w-full h-16 z-50 backdrop-blur-md bg-vault-light/80 dark:bg-vault-dark/80 border-b border-gray-100 dark:border-gray-900 transition-colors flex items-center justify-between px-6 font-sans">
      <button onClick={() => navigate("/")} className="hover:cursor-pointer flex items-center gap-2 group">
        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-600 via-rose-500 to-orange-400 flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
          <Aperture className="w-4 h-4 text-white" strokeWidth={2.5} />
        </span>
        <h1 className="font-black italic tracking-tighter text-xl text-gray-900 dark:text-white">
          EventVault
        </h1>
      </button>

      <div className="flex items-center gap-5">
        <div className="hidden sm:flex flex-col items-end leading-tight text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span>{locationName}</span>
          <span>{dateTime}</span>
        </div>

        <motion.button
          onClick={toggleTheme}
          whileTap={{ scale: 0.85 }}
          aria-label="Toggle dark mode"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-pink-500 border border-gray-100 dark:border-gray-800"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={dark ? "moon" : "sun"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center"
            >
              {dark ? <Moon size={16} /> : <Sun size={16} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {session ? (
          <button
            onClick={logout}
            className="bg-gray-900 dark:bg-pink-600 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:opacity-90 transition hover:cursor-pointer"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="bg-gradient-to-r from-pink-600 to-rose-500 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition shadow-md shadow-pink-500/20"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
