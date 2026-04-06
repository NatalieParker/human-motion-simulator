type JsonRecord = Record<string, unknown>;
type PortalLoadListener = (payload: JsonRecord) => void;

let portalOrigin: string | null = null;
const loadListeners = new Set<PortalLoadListener>();

function isInsideIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function postToPortal(type: string, payload: JsonRecord = {}): void {
  if (!isInsideIframe()) return;
  window.parent.postMessage({ type, payload }, portalOrigin || "*");
}

function normalizePayload(payload: unknown): JsonRecord {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as JsonRecord)
    : {};
}

function handleMessage(event: MessageEvent): void {
  const data = event.data as { type?: string; payload?: unknown } | null;
  if (!data || typeof data !== "object") return;

  if (!portalOrigin) portalOrigin = event.origin;

  if (data.type === "PORTAL_GAME_DATA_LOADED") {
    const normalized = normalizePayload(data.payload);
    loadListeners.forEach((listener) => listener(normalized));
  }
}

export function initPortalBridge(): () => void {
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}

export function fetchGameData(timeoutMs = 5000): Promise<JsonRecord> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      loadListeners.delete(onLoaded);
      reject(new Error("Timed out waiting for PORTAL_GAME_DATA_LOADED"));
    }, timeoutMs);

    const onLoaded: PortalLoadListener = (payload) => {
      window.clearTimeout(timer);
      loadListeners.delete(onLoaded);
      resolve(payload);
    };

    loadListeners.add(onLoaded);
    postToPortal("PORTAL_GAME_DATA_LOAD_REQUEST");
  });
}

export function saveGameData(data: JsonRecord): void {
  postToPortal("PORTAL_GAME_DATA_SAVE", data);
}

export function emitGameEvent(eventName: string, detail: JsonRecord = {}): void {
  postToPortal("PORTAL_GAME_EVENT", { event: eventName, ...detail });
}
