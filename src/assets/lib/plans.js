/**
 * Cloud storage plans — one-time payment per event, not a subscription.
 *
 * This mirrors the business model discussed: EventVault buys storage
 * wholesale from a provider (S3 / R2 / etc.) and resells it per event with
 * a markup, tied to a retention window rather than permanent storage — so
 * cost doesn't run forever after a one-time payment.
 *
 * `retentionDays` drives the event's expiry date. `storageCapGB` is the
 * soft cap shown against actual usage on the event dashboard.
 */
export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "Free",
    retentionDays: 15,
    storageCapGB: 2,
    tagline: "Try it on a small event",
    perks: ["Up to 2GB storage", "Live for 15 days", "Guest link + QR"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 499,
    priceLabel: "\u20B9499",
    retentionDays: 60,
    storageCapGB: 10,
    tagline: "Most weddings & birthdays",
    perks: ["Up to 10GB storage", "Live for 60 days", "Guest link + QR", "Admin full-vault access"],
    recommended: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 1499,
    priceLabel: "\u20B91,499",
    retentionDays: 180,
    storageCapGB: 50,
    tagline: "Large events, long guest lists",
    perks: ["Up to 50GB storage", "Live for 180 days", "Guest link + QR", "Admin full-vault access", "Priority support"],
  },
];

export function getPlan(planId) {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}
