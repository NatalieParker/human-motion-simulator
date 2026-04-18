import { useState } from "preact/hooks";
import { analyzeMotion } from "../../lib/openai/openai";
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
  const [expanded, setExpanded] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const color = MOTION_COLORS[pattern.localMotion] || MOTION_COLORS.unknown;
  const time = new Date(pattern.timestamp).toLocaleTimeString();

  async function handleClick() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);

    if (aiResult || aiLoading) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const result = await analyzeMotion(pattern.dataWindow);
      setAiResult(result);
    } catch (err) {
      console.error("OpenAI analysis failed:", err);
      setAiError(err.message || "Analysis failed");
    }
    setAiLoading(false);
  }

  async function handleRetry() {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await analyzeMotion(pattern.dataWindow);
      setAiResult(result);
    } catch (err) {
      console.error("OpenAI analysis failed:", err);
      setAiError(err.message || "Analysis failed");
    }
    setAiLoading(false);
  }

  const aiColor = aiResult
    ? MOTION_COLORS[aiResult.motion] || MOTION_COLORS.unknown
    : null;

  return (
    <div
      class={`pattern-card ${expanded ? "pattern-card--expanded" : ""}`}
      onClick={handleClick}
    >
      <div class="pattern-card__header">
        <span class="pattern-card__badge" style={{ background: color }}>
          {pattern.localMotion}
        </span>
        <span class="pattern-card__label">Local estimate</span>
        <span class="pattern-card__time">{time}</span>
      </div>

      {pattern.snapshot && (
        <img
          class="pattern-card__snapshot"
          src={pattern.snapshot}
          alt={`${pattern.localMotion} pattern`}
        />
      )}

      {!expanded && (
        <p class="pattern-card__hint">Click for AI analysis</p>
      )}

      {expanded && (
        <div class="pattern-card__ai" onClick={(e) => e.stopPropagation()}>
          {aiLoading && (
            <p class="pattern-card__ai-loading">Analyzing with AI...</p>
          )}
          {aiError && (
            <div class="pattern-card__ai-error">
              <p>{aiError}</p>
              <button class="pattern-card__retry-btn" onClick={handleRetry}>
                Retry
              </button>
            </div>
          )}
          {aiResult && (
            <div class="pattern-card__ai-result">
              <div class="pattern-card__ai-header">
                <span
                  class="pattern-card__badge"
                  style={{ background: aiColor }}
                >
                  {aiResult.motion}
                </span>
                <span
                  class="pattern-card__confidence"
                  style={{ color: aiColor }}
                >
                  {Math.round(aiResult.confidence * 100)}%
                </span>
                <span class="pattern-card__ai-label">OpenAI</span>
              </div>
              {aiResult.description && (
                <p class="pattern-card__desc">{aiResult.description}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
