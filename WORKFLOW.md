# EventVault — Workflow & Architecture

A quick reference for how the app fits together: who does what, which
route they land on, and what's real vs. simulated right now.

---

## The three roles

### 1. Organiser (event owner)

1. Sign up / log in at **`/organiser`**.
2. Land on **`/organiser/dashboard`** — every event you own, as cards.
3. **Create an event** (name, type, date, plan). This generates:
   - a unique **slug** (used in every URL for this event)
   - a **Guest ID + Guest password** — shared, every guest uses the same one
   - an **Admin ID + Admin password** — unique, only the owner should have this
4. Click **Manage** on a card → **`/organiser/event/:slug`**:
   - Create / delete folders (categories)
   - **"All photos"** — see everything across every folder at once, admin-style
   - Upload via the sidebar dropzone *or* the header **Upload** button (both need a real folder selected first — "All photos" isn't a place to upload into)
   - Select photos → **Select all** → **Download ZIP** or **Delete** (bulk)
   - **Scan faces** — upload a selfie and pull up matches across the whole event; the same tool guests get, useful for testing it or pulling a specific guest's photos on request
   - **Share** → QR code, link, and both credential pairs to hand out (`EventAccessPanel`)
   - Plan / storage, and a **Danger zone → Delete event**
5. An event can also be deleted straight from the events list (trash icon on each card, on hover).

### 2. Guest (the person who attended)

No account. Two ways in:
- Open the **direct link / QR** the organiser shared → straight to `/e/:slug`
- Go to **`/login`** and type the **shared Guest ID + password**

Once on `/e/:slug` (`UserPage`):
1. Upload one selfie
2. Optionally narrow by "Moment" (or leave it on "All Moments")
3. **Search My Photos** → matching photos come back
4. Select → **Select all** → **Download ZIP**

Guests can only ever reach their own event, and have no delete capability —
view + download only.

### 3. Admin (the owner's full, unfiltered vault)

There's **no separate admin login page**. Admin signs in on the exact same
**`/login`** form guests use — just with the unique Admin ID + password
instead of the shared Guest one. `/login` tries the guest credential first,
then the admin one, and routes accordingly:

- Guest match → `/e/:slug`
- Admin match → `/admin/:slug`

`/admin/:slug` (`AdminVault`) shows every category unfiltered, with the same
select / zip / delete toolkit as the organiser dashboard. Visiting it
directly without having signed in bounces back to `/login` — same for the
old `/adminlogin` URL, which now just redirects to `/login`.

---

## Routes at a glance

| Route | Who | What |
|---|---|---|
| `/` | anyone | Landing page |
| `/login` | guest **or** admin | one shared sign-in form |
| `/e/:slug` | guest | that event's search + gallery |
| `/organiser` | organiser | sign in / sign up |
| `/organiser/dashboard` | organiser | list of their events |
| `/organiser/event/:slug` | organiser | manage one event |
| `/admin/:slug` | admin | full unfiltered vault (session-gated) |

---

## What's real vs. simulated right now

This is a **prototype** — there's no backend/database yet, so `lib/store.js`
simulates one:

- **Organisers, events, folders, credentials** → `localStorage`. Survives a
  refresh, but is per-browser (not shared across devices). This part is
  already shaped like real database rows, so wiring up a real backend later
  is mostly a swap, not a rewrite.
- **Photos live only in memory, for the current browser tab.** Refreshing
  the page (or opening the app in a new tab) clears them — photo *files*
  are far too big for localStorage's ~5–10MB quota. This is the one
  deliberate seam where real cloud storage (S3/R2 behind a real backend)
  plugs in later.
- **Face matching is simulated.** There's no ML model wired in — a "scan"
  currently returns everything in scope rather than doing real recognition.
  Swapping in a real matching API is the natural next step once there's a
  backend to call it from.
- **Passwords are plain text** — there's no server to hash against yet.
  Fine for clicking through the flow end-to-end; not for production.

---

## What changed in this round

- **Bigger, consistent photo grids** on all three galleries (guest /
  organiser / admin) — done by giving the *container* more room (compact
  headers, smaller titles) rather than stretching individual photos, so
  odd-aspect-ratio photos don't distort or crop oddly.
- **Select photos → Select all → Download as ZIP**, on all three galleries.
- **Delete selected photos in bulk** — organiser and admin only; guests
  stay view/download-only.
- A header **Upload** button on the organiser dashboard, alongside the
  existing sidebar dropzone.
- **Delete an entire event** — from inside the event (Plan → Danger zone)
  or straight from the events list.

---

## Project structure (the parts you'll touch most)

```
src/assets/
  lib/
    store.js          ← the whole "backend" — organisers, events, photos, sessions
    plans.js           ← storage plan definitions (Basic/Standard/Premium)
    downloadZip.js      ← shared "bundle selected photos → .zip" helper
  pages/
    Landing.jsx         ← "/"
    Login.jsx           ← "/login" (guest + admin, one form)
    Organiser.jsx        ← "/organiser" sign in / sign up
    OrganiserMainDashboard.jsx  ← "/organiser/dashboard" (events list)
    OrganiserDashboard.jsx      ← "/organiser/event/:slug" (manage one event)
    UserPage.jsx         ← "/e/:slug" (guest gallery)
    AdminLogin.jsx        ← "/admin/:slug" (admin vault — name is legacy, it's not a login form any more)
    PhotoSelectionBar.jsx ← shared select-all/zip/delete toolbar used by all 3 galleries
    EventAccessPanel.jsx  ← the "Share" panel (QR, link, both credential pairs)
    CreateEventModal.jsx, Modal.jsx, PlanPicker.jsx, AuthInput.jsx  ← supporting UI
```
