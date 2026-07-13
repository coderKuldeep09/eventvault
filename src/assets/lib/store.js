/**
 * EventVault data layer — PROTOTYPE ONLY.
 *
 * There is no backend yet (that's the Go + Postgres step discussed for
 * later), so this module simulates one using localStorage:
 *   - organisers  → real accounts, so multiple organisers stay separate
 *   - events      → one row per event, owned by an organiser
 *   - session     → who is currently "logged in" and as what role
 *
 * Photos are NOT put in localStorage — real photos are far too big for
 * it (5-10MB total quota) and would crash the app. Instead photo bytes
 * live in an in-memory store for the current browser tab (see the
 * "Photos" section below). This is exactly the seam where real cloud
 * storage (S3 / R2 via a backend) plugs in later — everything above that
 * seam (accounts, events, credentials, categories) is already shaped for
 * a real database and will not need to change.
 *
 * Passwords are stored as plain text here for the same reason — there is
 * no server to hash/verify against. Do not reuse this auth for anything
 * real; it's here so the multi-organiser / multi-event flow can be
 * clicked through end-to-end.
 */

import { getPlan } from "./plans";

const LS_KEYS = {
  ORGANISERS: "eventvault_organisers",
  EVENTS: "eventvault_events",
  SESSION: "eventvault_session",
};

/* ------------------------------------------------------------------ */
/* low-level storage helpers                                          */
/* ------------------------------------------------------------------ */

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error("EventVault storage write failed:", err);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* id / slug / code helpers                                           */
/* ------------------------------------------------------------------ */

function randomId(len = 10) {
  return Math.random().toString(36).slice(2, 2 + len) + Date.now().toString(36).slice(-4);
}

// Excludes visually-confusing characters (0/O, 1/I) since guests may be
// reading these off a printed invite card and typing them by hand.
function randomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function slugify(text) {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "event";
}

function uniqueSlug(name, events) {
  const base = slugify(name);
  let slug = base;
  let guard = 0;
  while (events.some((e) => e.slug === slug)) {
    slug = `${base}-${randomCode(4).toLowerCase()}`;
    guard += 1;
    if (guard > 25) break; // astronomically unlikely, just a safety valve
  }
  return slug;
}

/* ------------------------------------------------------------------ */
/* Session                                                            */
/* ------------------------------------------------------------------ */

export function getSession() {
  return readLS(LS_KEYS.SESSION, null);
}

export function setSession(session) {
  writeLS(LS_KEYS.SESSION, session);
}

export function clearSession() {
  localStorage.removeItem(LS_KEYS.SESSION);
}

/* ------------------------------------------------------------------ */
/* Organisers (accounts)                                              */
/* ------------------------------------------------------------------ */

export function getOrganisers() {
  return readLS(LS_KEYS.ORGANISERS, []);
}

function saveOrganisers(list) {
  writeLS(LS_KEYS.ORGANISERS, list);
}

export function getOrganiserById(id) {
  return getOrganisers().find((o) => o.id === id) || null;
}

export function signupOrganiser({ name, username, password }) {
  const cleanUsername = username.trim();
  if (!name.trim() || !cleanUsername || !password) {
    return { error: "Fill in your name, username, and password." };
  }
  const organisers = getOrganisers();
  if (organisers.some((o) => o.username.toLowerCase() === cleanUsername.toLowerCase())) {
    return { error: "That username is taken. Try logging in instead." };
  }
  const organiser = {
    id: randomId(),
    name: name.trim(),
    username: cleanUsername,
    password,
    createdAt: new Date().toISOString(),
  };
  saveOrganisers([...organisers, organiser]);
  setSession({ role: "organiser", organiserId: organiser.id });
  return { organiser };
}

export function loginOrganiser({ username, password }) {
  const cleanUsername = username.trim();
  const organiser = getOrganisers().find(
    (o) => o.username.toLowerCase() === cleanUsername.toLowerCase() && o.password === password
  );
  if (!organiser) {
    return { error: "Incorrect username or password." };
  }
  setSession({ role: "organiser", organiserId: organiser.id });
  return { organiser };
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export function getEvents() {
  return readLS(LS_KEYS.EVENTS, []);
}

function saveEvents(list) {
  writeLS(LS_KEYS.EVENTS, list);
}

export function getEventsByOrganiser(organiserId) {
  return getEvents()
    .filter((e) => e.organiserId === organiserId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getEventBySlug(slug) {
  if (!slug) return null;
  return getEvents().find((e) => e.slug === slug.toLowerCase()) || null;
}

export function getEventById(id) {
  return getEvents().find((e) => e.id === id) || null;
}

export function createEvent({ organiserId, name, type, date, planId }) {
  const events = getEvents();
  const plan = getPlan(planId);
  const slug = uniqueSlug(name, events);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.retentionDays * 24 * 60 * 60 * 1000);

  const event = {
    id: randomId(),
    organiserId,
    name: name.trim(),
    type: type || "Wedding",
    date: date || null,
    slug,
    guestUsername: slug,
    guestPassword: randomCode(6),
    adminUsername: `${slug}-admin`,
    adminPassword: randomCode(8),
    categories: [],
    plan: { id: plan.id, name: plan.name, retentionDays: plan.retentionDays, storageCapGB: plan.storageCapGB },
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  saveEvents([...events, event]);
  return event;
}

export function updateEvent(eventId, updates) {
  const events = getEvents();
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...updates };
  saveEvents(events);
  return events[idx];
}

export function deleteEvent(eventId) {
  saveEvents(getEvents().filter((e) => e.id !== eventId));
  delete photoMemory[eventId];
}

export function upgradeEventPlan(eventId, planId) {
  const plan = getPlan(planId);
  const expiresAt = new Date(Date.now() + plan.retentionDays * 24 * 60 * 60 * 1000);
  return updateEvent(eventId, {
    plan: { id: plan.id, name: plan.name, retentionDays: plan.retentionDays, storageCapGB: plan.storageCapGB },
    expiresAt: expiresAt.toISOString(),
  });
}

export function regenerateGuestPassword(eventId) {
  return updateEvent(eventId, { guestPassword: randomCode(6) });
}

export function regenerateAdminPassword(eventId) {
  return updateEvent(eventId, { adminPassword: randomCode(8) });
}

export function isEventExpired(event) {
  if (!event?.expiresAt) return false;
  return new Date(event.expiresAt).getTime() < Date.now();
}

export function daysRemaining(event) {
  if (!event?.expiresAt) return 0;
  const ms = new Date(event.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/* ------------------------------------------------------------------ */
/* Categories (live inside an event)                                  */
/* ------------------------------------------------------------------ */

export function addCategory(eventId, categoryName) {
  const event = getEventById(eventId);
  if (!event) return null;
  const trimmed = categoryName.trim();
  if (!trimmed) return event;
  if (event.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return event;
  const category = { id: randomId(6), name: trimmed };
  return updateEvent(eventId, { categories: [...event.categories, category] });
}

export function removeCategory(eventId, categoryId) {
  const event = getEventById(eventId);
  if (!event) return null;
  removePhotosByCategory(eventId, categoryId);
  return updateEvent(eventId, { categories: event.categories.filter((c) => c.id !== categoryId) });
}

/* ------------------------------------------------------------------ */
/* Guest / Admin credential resolution                                */
/* ------------------------------------------------------------------ */

export function resolveGuestAccess({ username, password }) {
  const cleanUsername = username.trim().toLowerCase();
  return (
    getEvents().find((e) => e.guestUsername.toLowerCase() === cleanUsername && e.guestPassword === password) || null
  );
}

export function resolveAdminAccess({ username, password }) {
  const cleanUsername = username.trim().toLowerCase();
  return (
    getEvents().find((e) => e.adminUsername.toLowerCase() === cleanUsername && e.adminPassword === password) || null
  );
}

/* ------------------------------------------------------------------ */
/* Photos — in-memory only, per browser tab session.                  */
/*                                                                     */
/* Deliberately NOT in localStorage: real photos are megabytes each,  */
/* and localStorage's ~5-10MB quota would overflow almost immediately */
/* and start throwing errors on upload. Until real cloud storage is   */
/* wired up, photos live only as long as this tab does — refreshing   */
/* clears them, same as before this update. Everything that reads or  */
/* writes photos goes through these functions so swapping this out    */
/* for real API calls later only touches this one file.               */
/* ------------------------------------------------------------------ */

const photoMemory = {}; // { [eventId]: Photo[] }
const EMPTY_PHOTOS = []; // stable reference — avoids a new [] identity on every call,
// which would otherwise retrigger any useEffect/useMemo/useCallback that depends on it

export function getEventPhotos(eventId) {
  return photoMemory[eventId] || EMPTY_PHOTOS;
}

export function addEventPhotos(eventId, category, files) {
  const existing = photoMemory[eventId] || [];
  const newPhotos = files.map((f) => ({
    id: randomId(8),
    categoryId: category.id,
    categoryName: category.name,
    src: URL.createObjectURL(f),
    name: f.name,
    sizeMB: Number((f.size / 1024 / 1024).toFixed(2)),
    uploadedAt: new Date().toISOString(),
  }));
  photoMemory[eventId] = [...existing, ...newPhotos];
  return photoMemory[eventId];
}

export function deleteEventPhoto(eventId, photoId) {
  const existing = photoMemory[eventId] || [];
  const target = existing.find((p) => p.id === photoId);
  if (target) URL.revokeObjectURL(target.src);
  photoMemory[eventId] = existing.filter((p) => p.id !== photoId);
  return photoMemory[eventId];
}

function removePhotosByCategory(eventId, categoryId) {
  const existing = photoMemory[eventId] || [];
  existing.filter((p) => p.categoryId === categoryId).forEach((p) => URL.revokeObjectURL(p.src));
  photoMemory[eventId] = existing.filter((p) => p.categoryId !== categoryId);
}

export function getEventStorageUsedMB(eventId) {
  return getEventPhotos(eventId).reduce((sum, p) => sum + p.sizeMB, 0);
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function guestLinkFor(event) {
  if (typeof window === "undefined" || !event) return "";
  return `${window.location.origin}/e/${event.slug}`;
}
