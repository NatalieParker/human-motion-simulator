import { configureSessionChannel, clearSessionChannel } from "../supabase/supabase";
import { env } from "../env";

const STORAGE_KEY = "hms_pairing_session_id";
let inMemoryDesktopSessionId = "";

function isUuidLike(s) {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function getSessionStorageSafe() {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function readStoredSessionId() {
  const storage = getSessionStorageSafe();
  if (!storage) return "";
  try {
    return storage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function writeStoredSessionId(sessionId) {
  const storage = getSessionStorageSafe();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, sessionId);
  } catch {
    // Ignore storage write failures in restricted iframe contexts.
  }
}

/**
 * Desktop (train / sandbox): one pairing id per browser tab (sessionStorage).
 * Survives refresh; new tab gets a new id.
 */
export function initDesktopPairingSession() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("session");
  if (fromUrl && isUuidLike(fromUrl)) {
    inMemoryDesktopSessionId = fromUrl;
    writeStoredSessionId(fromUrl);
    configureSessionChannel(fromUrl);
    return fromUrl;
  }

  let id = readStoredSessionId() || inMemoryDesktopSessionId;
  if (!id || !isUuidLike(id)) {
    id = crypto.randomUUID();
    inMemoryDesktopSessionId = id;
    writeStoredSessionId(id);
  }
  inMemoryDesktopSessionId = id;
  configureSessionChannel(id);
  return id;
}

/** New random pairing (e.g. "pair different phone"). */
export function resetDesktopPairingSession() {
  if (typeof window === "undefined") return "";
  const id = crypto.randomUUID();
  inMemoryDesktopSessionId = id;
  writeStoredSessionId(id);
  configureSessionChannel(id);
  return id;
}

/**
 * Mobile controller: session id must come from QR/link (?session=).
 */
export function getControllerSessionFromUrl() {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("session");
  if (raw && isUuidLike(raw)) return raw;

  // Some portal redirects can strip query params; allow hash fallback.
  const hashRaw = String(window.location.hash || "").replace(/^#/, "");
  const hashParams = new URLSearchParams(hashRaw.startsWith("?") ? hashRaw.slice(1) : hashRaw);
  const fromHash = hashParams.get("session");
  if (fromHash && isUuidLike(fromHash)) return fromHash;

  // Last-resort parser for hashes like "#/controller?session=..."
  const hashQueryPart = hashRaw.includes("?") ? hashRaw.slice(hashRaw.indexOf("?") + 1) : "";
  const nestedHashParams = new URLSearchParams(hashQueryPart);
  const nested = nestedHashParams.get("session");
  if (nested && isUuidLike(nested)) return nested;

  return null;
}

export function applyControllerSessionFromUrl() {
  const id = getControllerSessionFromUrl();
  if (id) configureSessionChannel(id);
  else clearSessionChannel();
  return id;
}

/** Full URL to controller.html with ?session= for this browser tab’s pairing id. */
export function buildControllerPairUrl(sessionId) {
  if (typeof window === "undefined" || !sessionId) return "";
  const base = typeof env.BASE_URL === "string" && env.BASE_URL ? env.BASE_URL : "/";
  const baseUrl = new URL(base, window.location.origin);
  const url = new URL("controller.html", baseUrl);
  url.searchParams.set("session", sessionId);
  // Hash fallback for environments that rewrite/drop query strings.
  url.hash = `session=${sessionId}`;
  return url.href;
}
 