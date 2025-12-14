// src/utils/media.js
const DEFAULT_API = "http://localhost:5000/api";

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"];
const VIDEO_EXTS = [".mp4", ".webm", ".ogg", ".mov", ".mkv"];

function ensureSlashLeft(s) {
  if (!s) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

export function getBackendRoot(apiUrl) {
  const apiBase = apiUrl || import.meta.env.VITE_API_URL || DEFAULT_API;
  return apiBase.replace(/\/api\/?$/, "");
}

export function getMediaType(rawUrl, opts = {}) {
  if (!rawUrl) return "unknown";
  if (typeof rawUrl === "object") {
    if (rawUrl.type) return rawUrl.type;
    rawUrl = rawUrl.url || rawUrl.filename || rawUrl.path || "";
  }
  if (typeof rawUrl !== "string") return "unknown";
  const lower = rawUrl.toLowerCase();

  try {
    const u = new URL(lower, "http://example.com");
    const pathname = u.pathname || "";
    const ext = pathname.slice(pathname.lastIndexOf(".")).toLowerCase();
    if (IMAGE_EXTS.includes(ext)) return "image";
    if (VIDEO_EXTS.includes(ext)) return "video";
  } catch {}

  const ext = lower.slice(lower.lastIndexOf("."));
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (opts.typeHint === "image") return "image";
  if (opts.typeHint === "video") return "video";
  return "unknown";
}

export function getPlaceholder(type = "image") {
  if (type === "video") return "https://via.placeholder.com/1200x600.png?text=No+Video";
  return "https://via.placeholder.com/1200x600.png?text=No+Image";
}

export function normalizeMediaUrl(rawUrl, opts = {}) {
  if (!rawUrl) return null;

  let urlCandidate = null;
  if (typeof rawUrl === "object") {
    urlCandidate = rawUrl.url || rawUrl.path || rawUrl.filename || null;
  } else {
    urlCandidate = rawUrl;
  }

  if (!urlCandidate || typeof urlCandidate !== "string") return null;
  if (/^https?:\/\//i.test(urlCandidate)) return urlCandidate;

  const backendRoot = getBackendRoot(opts.apiUrl);

  if (urlCandidate.startsWith("/")) {
    return `${backendRoot}${urlCandidate}`;
  }

  if (urlCandidate.includes("/")) {
    return `${backendRoot}/${urlCandidate.replace(/^\/+/, "")}`;
  }

  const inferredType = getMediaType(urlCandidate, opts);
  const folder = opts.folder || (inferredType === "video" ? "uploads/videos" : "uploads");
  return `${backendRoot}/${ensureSlashLeft(folder).replace(/^\/+/, "")}/${urlCandidate}`;
}

export default {
  normalizeMediaUrl,
  getMediaType,
  getPlaceholder,
  getBackendRoot
};
