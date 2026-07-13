import { Check } from "lucide-react";
import { PLANS } from "../lib/plans";

/**
 * Tier picker for cloud storage — used both when creating a new event and
 * when upgrading an existing one. One-time payment per event, tied to a
 * retention window (see lib/plans.js for the reasoning).
 */
export function PlanPicker({ selectedId, onSelect }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {PLANS.map((plan) => {
        const active = selectedId === plan.id;
        return (
          <button
            type="button"
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            className={`relative text-left p-5 rounded-[1.75rem] border-2 transition-all ${
              active
                ? "border-pink-500 bg-pink-500/5 shadow-lg shadow-pink-500/10"
                : "border-gray-100 dark:border-gray-800 hover:border-pink-200 dark:hover:border-gray-700"
            }`}
          >
            {plan.recommended && (
              <span className="absolute -top-2.5 left-5 bg-gray-900 dark:bg-pink-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                Popular
              </span>
            )}
            <div className="flex items-center justify-between mb-1">
              <p className="font-black text-sm uppercase tracking-widest text-gray-900 dark:text-white">
                {plan.name}
              </p>
              {active && (
                <span className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="font-black italic text-2xl tracking-tighter mb-1 text-gray-900 dark:text-white">
              {plan.priceLabel}
            </p>
            <p className="text-[11px] text-gray-400 font-medium mb-3">{plan.tagline}</p>
            <ul className="space-y-1.5">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <Check size={12} className="text-pink-500 mt-0.5 shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
