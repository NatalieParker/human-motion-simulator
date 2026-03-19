import "./MatchMeter.css";

export function MatchMeter({ score, gameState }) {
  const pct = Math.round(score * 100);

  let barColor;
  if (score < 0.3) barColor = "#f87171";
  else if (score < 0.55) barColor = "#facc15";
  else barColor = "#4ade80";

  return (
    <div class="match-meter">
      <div class="match-meter__header">
        <h2>Match Progress</h2>
        <span class="match-meter__value" style={{ color: barColor }}>
          {gameState === "idle" ? "\u2014" : `${pct}%`}
        </span>
      </div>
      <div class="match-meter__track">
        <div
          class="match-meter__fill"
          style={{ width: `${gameState === "idle" ? 0 : pct}%`, background: barColor }}
        />
      </div>
      {gameState === "matched" && (
        <div class="match-meter__success">Motion Matched!</div>
      )}
    </div>
  );
}
