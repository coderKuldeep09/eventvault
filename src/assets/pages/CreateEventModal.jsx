import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, PartyPopper, Sparkles, Music, Briefcase, Users2, CheckCircle2 } from "lucide-react";
import { createEvent } from "../lib/store";
import { PlanPicker } from "./PlanPicker";
import { EventAccessPanel } from "./EventAccessPanel";
import { Modal } from "./Modal";

const EVENT_TYPES = [
  { label: "Wedding", icon: Sparkles },
  { label: "Birthday", icon: PartyPopper },
  { label: "Concert", icon: Music },
  { label: "Corporate", icon: Briefcase },
  { label: "Reunion", icon: Users2 },
];

export function CreateEventModal({ open, onClose, organiserId, onCreated }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Wedding");
  const [date, setDate] = useState("");
  const [planId, setPlanId] = useState("standard");
  const [createdEvent, setCreatedEvent] = useState(null);

  function reset() {
    setName("");
    setType("Wedding");
    setDate("");
    setPlanId("standard");
    setCreatedEvent(null);
  }

  function handleClose() {
    onClose();
    // wait for the close animation before wiping the form
    setTimeout(reset, 200);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const event = createEvent({ organiserId, name, type, date, planId });
    setCreatedEvent(event);
    onCreated?.(event);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      eyebrow={createdEvent ? "You're all set" : "New event"}
      title={createdEvent ? createdEvent.name : "Create an event"}
      maxWidth="max-w-xl"
    >
      {!createdEvent ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Event name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul &amp; Priya's Wedding"
              className="w-full bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-pink-500/50 focus:bg-white dark:focus:bg-white/10 px-4 py-3.5 rounded-2xl text-sm outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t.label}
                    onClick={() => setType(t.label)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
                      type === t.label
                        ? "border-pink-500 bg-pink-500/5 text-pink-500"
                        : "border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200"
                    }`}
                    title={t.label}
                  >
                    <t.icon size={16} />
                    <span className="text-[8px] font-black uppercase tracking-wide">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Date <span className="normal-case font-medium text-gray-300">(optional)</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-pink-500/50 px-4 py-3.5 rounded-2xl text-sm outline-none transition-all text-gray-900 dark:text-white h-full"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Cloud storage plan
            </label>
            <PlanPicker selectedId={planId} onSelect={setPlanId} />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-gradient-to-r from-pink-600 to-rose-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-lg hover:shadow-pink-500/20 transition disabled:opacity-30"
          >
            Create event &amp; generate access <ArrowRight size={15} />
          </motion.button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 rounded-2xl">
            <CheckCircle2 size={16} />
            <p className="text-xs font-bold">
              Event created on the {createdEvent.plan.name} plan — live for {createdEvent.plan.retentionDays} days.
            </p>
          </div>
          <EventAccessPanel event={createdEvent} />
          <button
            onClick={handleClose}
            className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition"
          >
            Done — take me to the dashboard
          </button>
        </div>
      )}
    </Modal>
  );
}
