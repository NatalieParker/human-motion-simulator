import "./PatternCard.css";

const MOTION_COLORS = {
  walking: "#38bdf8",
  running: "#f87171",
  jumping: "#4ade80",
  stairs: "#fb923c",
  stationary: "#94a3b8",
  unknown: "#a78bfa",
};

export function PatternCard({ pattern }) {
  const color = MOTION_COLORS[pattern.motion] || MOTION_COLORS.unknown;
  const time = new Date(pattern.timestamp).toLocaleTimeString();
  const pct = Math.round(pattern.confidence * 100);

  return (
    <div class="pattern-card">
      <div class="pattern-card__header">
        <span class="pattern-card__badge" style={{ background: color }}>
          {pattern.motion}
        </span>
        <span class="pattern-card__confidence" style={{ color }}>
          {pct}%
        </span>
        <span class="pattern-card__time">{time}</span>
      </div>
      {pattern.snapshot && (
        <img
          class="pattern-card__snapshot"
          src={pattern.snapshot}
          alt={`${pattern.motion} pattern`}
        />
      )}
      {pattern.description && (
        <p class="pattern-card__desc">{pattern.description}</p>
      )}
    </div>
  );
}
