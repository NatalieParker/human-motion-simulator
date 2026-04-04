/**
 * Communication bridge between the game (iframe) and the hosting web portal.
 *
 * The portal embeds this game via an iframe like:
 *   <iframe src="https://game-url.com/train.html?userId=abc123&gameDataId=456"></iframe>
 *
 * Data flows two ways:
 *   1. Game  -> Portal: postMessage with { type, payload }
 *   2. Portal -> Game:  postMessage with { type, payload }
 *
 * The portal is responsible for proxying database reads/writes — the game
 * never talks to the portal DB directly.
 */

const PORTAL_MESSAGE_PREFIX = "hms"; // human-motion-simulator namespace

let _portalOrigin = null;
const _pendingRequests = new Map();
let _requestId = 0;
const _listeners = new Map();

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    userId: params.get("userId"),
    gameDataId: params.get("gameDataId"),
  };
}

function isInsideIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function sendToPortal(type, payload = {}) {
  if (!isInsideIframe()) return;
  const target = _portalOrigin || "*";
  window.parent.postMessage(
    { source: PORTAL_MESSAGE_PREFIX, type, payload },
    target,
  );
}

function requestFromPortal(type, payload = {}, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (!isInsideIframe()) {
      reject(new Error("Not running inside an iframe"));
      return;
    }
    const id = ++_requestId;
    const responseType = `${type}:response`;

    const timer = setTimeout(() => {
      _pendingRequests.delete(id);
      reject(new Error(`Portal request "${type}" timed out`));
    }, timeoutMs);

    _pendingRequests.set(id, { resolve, reject, timer, responseType });

    const target = _portalOrigin || "*";
    window.parent.postMessage(
      { source: PORTAL_MESSAGE_PREFIX, type, payload, requestId: id },
      target,
    );
  });
}

function handleIncomingMessage(event) {
  const data = event.data;
  if (!data || data.source !== PORTAL_MESSAGE_PREFIX) return;

  if (!_portalOrigin) _portalOrigin = event.origin;

  if (data.requestId && _pendingRequests.has(data.requestId)) {
    const pending = _pendingRequests.get(data.requestId);
    clearTimeout(pending.timer);
    _pendingRequests.delete(data.requestId);
    if (data.error) {
      pending.reject(new Error(data.error));
    } else {
      pending.resolve(data.payload);
    }
    return;
  }

  const handlers = _listeners.get(data.type);
  if (handlers) {
    handlers.forEach((fn) => fn(data.payload));
  }
}

function onPortalMessage(type, callback) {
  if (!_listeners.has(type)) _listeners.set(type, new Set());
  _listeners.get(type).add(callback);
  return () => _listeners.get(type).delete(callback);
}

// ── Public high-level API ──────────────────────────────────────────

export function initPortalBridge() {
  window.addEventListener("message", handleIncomingMessage);
  return () => window.removeEventListener("message", handleIncomingMessage);
}

export { getParams, isInsideIframe, onPortalMessage };

/** Ask the portal for the current game_data row for this user. */
export function fetchGameData() {
  const { userId, gameDataId } = getParams();
  return requestFromPortal("getGameData", { userId, gameDataId });
}

/** Send updated game data to the portal for persistence. */
export function saveGameData(data) {
  const { userId, gameDataId } = getParams();
  return requestFromPortal("saveGameData", { userId, gameDataId, data });
}

/** Fire-and-forget event (no response expected). */
export function emitGameEvent(eventName, detail = {}) {
  sendToPortal("gameEvent", { event: eventName, ...detail });
}
