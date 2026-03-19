import "./StatusBadge.css";

export function StatusBadge({ text, variant }) {
  return <span class={`status-badge status-${variant}`}>{text}</span>;
}
