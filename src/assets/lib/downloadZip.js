import JSZip from "jszip";

/**
 * Bundles the given photos into a single .zip and triggers a browser
 * download. Used by the guest, organiser and admin galleries so "select
 * some photos → download" behaves identically everywhere.
 *
 * photos: array of { src, name } — src can be a blob: URL (the normal
 * case, since uploaded photos live in in-memory object URLs — see
 * lib/store.js) or any same-origin/fetchable URL.
 */
export async function downloadPhotosAsZip(photos, zipName = "photos") {
  if (!photos || photos.length === 0) return { ok: false, reason: "empty" };

  const zip = new JSZip();
  const usedNames = new Set();

  function uniqueName(base, index) {
    let name = base || `photo-${index + 1}.jpg`;
    if (!/\.[a-zA-Z0-9]+$/.test(name)) name += ".jpg";
    if (usedNames.has(name)) {
      const dot = name.lastIndexOf(".");
      name = `${name.slice(0, dot)}-${index + 1}${name.slice(dot)}`;
    }
    usedNames.add(name);
    return name;
  }

  const results = await Promise.allSettled(
    photos.map(async (p, i) => {
      const res = await fetch(p.src);
      if (!res.ok) throw new Error(`Fetch failed for ${p.src}`);
      const blob = await res.blob();
      zip.file(uniqueName(p.name, i), blob);
    })
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed === photos.length) return { ok: false, reason: "all-failed" };

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${zipName}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return { ok: true, failed };
}
