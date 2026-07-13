import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, RefreshCw, Link2, KeyRound, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { guestLinkFor, regenerateGuestPassword, regenerateAdminPassword } from "../lib/store";

function CopyField({ label, value, onRegenerate }) {
  const copy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error("Couldn't copy — copy it manually"));
  };
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 rounded-xl px-3.5 py-2.5 font-mono text-xs truncate text-gray-800 dark:text-gray-200">
          {value}
        </div>
        <button
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="shrink-0 w-9 h-9 rounded-xl bg-gray-900 dark:bg-pink-600 text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition"
        >
          <Copy size={14} />
        </button>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            aria-label={`Regenerate ${label}`}
            title="Generate a new password"
            className="shrink-0 w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center hover:text-pink-500 active:scale-95 transition"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Shows everything needed to get guests and the event's admin (the
 * couple / event owner) in: the shared link + QR for guests, the shared
 * guest ID+password as a fallback, and the admin's own credentials for
 * full-vault access. Read-only display + copy/regenerate — no other
 * logic lives here.
 */
export function EventAccessPanel({ event, onEventChange }) {
  const [current, setCurrent] = useState(event);
  const link = guestLinkFor(current);

  function refresh(updated) {
    if (updated) {
      setCurrent(updated);
      onEventChange?.(updated);
    }
  }

  return (
    <div className="space-y-7">
      <section>
        <div className="flex items-center gap-2 mb-4 text-pink-500">
          <Link2 size={14} />
          <p className="text-[10px] font-black uppercase tracking-[0.25em]">Guest access</p>
        </div>
        <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-start">
          <div className="mx-auto sm:mx-0 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <QRCodeSVG value={link} size={112} bgColor="#ffffff" fgColor="#17140F" marginSize={0} />
          </div>
          <div className="space-y-3 w-full">
            <CopyField label="Shareable link" value={link} />
            <div className="grid grid-cols-2 gap-3">
              <CopyField label="Guest ID" value={current.guestUsername} />
              <CopyField
                label="Guest password"
                value={current.guestPassword}
                onRegenerate={() => refresh(regenerateGuestPassword(current.id))}
              />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
          Share the QR or link on your invite — guests land straight on the selfie screen, no typing needed. The
          ID + password is a manual fallback for guests who can't scan or click through.
        </p>
      </section>

      <section className="pt-6 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
          <ShieldCheck size={14} className="text-pink-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.25em]">Admin access — full vault</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CopyField label="Admin ID" value={current.adminUsername} />
          <CopyField
            label="Admin password"
            value={current.adminPassword}
            onRegenerate={() => refresh(regenerateAdminPassword(current.id))}
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed flex items-start gap-1.5">
          <KeyRound size={12} className="mt-0.5 shrink-0" />
          Give this only to the event owner — they sign in with it on the exact same login page as
          guests, and get every category, unfiltered, no face match needed.
        </p>
      </section>
    </div>
  );
}
