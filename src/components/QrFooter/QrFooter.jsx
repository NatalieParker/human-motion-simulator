import "./QrFooter.css";

export function QrFooter() {
  const qrSrc = `${import.meta.env.BASE_URL}assets/qr_code_controller.png`;

  return (
    <div class="qr-footer">
      <p class="qr-footer__label">Scan to open controller</p>
      <img
        class="qr-footer__image"
        src={qrSrc}
        alt="QR code to open controller page"
      />
    </div>
  );
}
