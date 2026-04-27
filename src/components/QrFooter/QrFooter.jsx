import { useState } from "preact/hooks";
import { buildControllerPairUrl } from "../../lib/sessionChannel/sessionChannel";
import "./QrFooter.css";

export function QrFooter({ sessionId, onNewPairing, buttonLabel = "Pair Phone" }) {
  const [open, setOpen] = useState(false);
  const url = sessionId ? buildControllerPairUrl(sessionId) : "";
  const qrSrc = url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`
    : "";

  return (
    <div class="qr-footer">
      <button
        type="button"
        class="qr-footer__toggle"
        onClick={() => setOpen(true)}
        disabled={!sessionId}
      >
        {buttonLabel}
      </button>

      {open && (
        <div
          class="qr-footer__backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div class="qr-footer__dialog" role="dialog" aria-modal="true" aria-label="Phone pairing">
            <div class="qr-footer__dialog-header">
              <p class="qr-footer__badge">Phone Pairing</p>
              <button
                type="button"
                class="qr-footer__close"
                onClick={() => setOpen(false)}
                aria-label="Close pairing dialog"
              >
                Close
              </button>
            </div>

            <p class="qr-footer__label">Scan to open controller for this browser tab</p>
            <img
              class="qr-footer__image"
              src={qrSrc}
              alt="QR code to open controller page for this session"
            />
            <p class="qr-footer__link">
              <a href={url} target="_blank" rel="noreferrer">
                Open controller link
              </a>
            </p>
            {typeof onNewPairing === "function" && (
              <button
                type="button"
                class="qr-footer__new-pairing"
                onClick={onNewPairing}
              >
                New phone pairing
              </button>
            )}
          </div>
        </div>
      )}

      {!sessionId && <p class="qr-footer__pending">Preparing pairing...</p>}
    </div>
  );
}
