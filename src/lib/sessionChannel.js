import { configureSessionChannel, clearSessionChannel } from "./supabase";

const STORAGE_KEY = "hms_pairing_session_id";

function isUuidLike(s) {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
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
    sessionStorage.setItem(STORAGE_KEY, fromUrl);
    configureSessionChannel(fromUrl);
    return fromUrl;
  }

  let id = sessionStorage.getItem(STORAGE_KEY);
  if (!id || !isUuidLike(id)) {
    id = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEY, id);
  }
  configureSessionChannel(id);
  return id;
}

/** New random pairing (e.g. "pair different phone"). */
export function resetDesktopPairingSession() {
  if (typeof window === "undefined") return "";
  const id = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_KEY, id);
  configureSessionChannel(id);
  return id;
}

/**
 * Mobile controller: session id must come from QR/link (?session=).
 */
export function getControllerSessionFromUrl() {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("session");
  if (!raw || !isUuidLike(raw)) return null;
  return raw;
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
  const base = import.meta.env.BASE_URL || "/";
  const url = new URL(
    "controller.html",
    `${window.location.origin}${base.endsWith("/") ? base : `${base}/`}`
  );
  url.searchParams.set("session", sessionId);
  return url.href;
}
