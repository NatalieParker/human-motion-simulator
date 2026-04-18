import { buildControllerPairUrl } from "../../lib/sessionChannel/sessionChannel";
import "./QrFooter.css";

export function QrFooter({ sessionId, onNewPairing }) {
  if (!sessionId) {
    return (
      <div class="qr-footer">
        <p class="qr-footer__label">Loading pairing session…</p>
      </div>
    );
  }

  const url = buildControllerPairUrl(sessionId);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;

  return (
    <div class="qr-footer">
      <p class="qr-footer__label">Scan to open controller (pairs only this browser tab)</p>
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
        <button type="button" class="qr-footer__new-pairing btn btn--secondary" onClick={onNewPairing}>
          New phone pairing
        </button>
      )}
    </div>
  );
}
