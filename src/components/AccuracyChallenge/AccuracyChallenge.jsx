import { useState, useEffect, useRef } from "preact/hooks";
import {
  extractReferenceFeatures,
  extractLiveFeatures,
  computeMatchScore,
} from "../../lib/motionMatcher/motionMatcher";
import { MOTION_LABELS } from "../../lib/motionPatterns/motionPatterns";
import { ReferenceChart } from "../ReferenceChart/ReferenceChart";
import { LiveChart } from "../LiveChart/LiveChart";
import { MatchMeter } from "../MatchMeter/MatchMeter";
import "./AccuracyChallenge.css";

const ACCURACY_THRESHOLD = 0.8;
const SUSTAINED_FRAMES = 25;

export function AccuracyChallenge({
  sensorData,
  referencePattern,
  motion,
  pairingSessionId,
  onNewPairing,
  onComplete,
  onStart,
  onStop,
}) {
  const [phase, setPhase] = useState("intro");
  const [matchScore, setMatchScore] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(null);
  const [chartKey, setChartKey] = useState(0);

  const startTimeRef = useRef(Date.now());
  const liveBufferRef = useRef([]);
  const matchCountRef = useRef(0);
  const smoothedScoreRef = useRef(0);
  const refFeaturesRef = useRef(null);

  useEffect(() => {
    refFeaturesRef.current = extractReferenceFeatures(referencePattern);
  }, [referencePattern]);

  function handleBegin() {
    onStart();
    startTimeRef.current = Date.now();
    setChartKey((k) => k + 1);
    liveBufferRef.current = [];
    matchCountRef.current = 0;
    smoothedScoreRef.current = 0;
    setMatchScore(0);
    setElapsedMs(null);
    setPhase("active");
  }

  useEffect(() => {
    if (phase !== "active" || !sensorData) return;

    const a = sensorData.acceleration || {};
    const mag = Math.sqrt(
      (a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2
    );

    const buf = liveBufferRef.current;
    buf.push(mag);
    if (buf.length > 50) buf.shift();

    if (buf.length >= 20 && refFeaturesRef.current) {
      const liveFeatures = extractLiveFeatures(buf);
      const raw = computeMatchScore(liveFeatures, refFeaturesRef.current);

      const smoothed = smoothedScoreRef.current * 0.7 + raw * 0.3;
      smoothedScoreRef.current = smoothed;
      setMatchScore(smoothed);

      if (smoothed >= ACCURACY_THRESHOLD) {
        matchCountRef.current++;
        if (matchCountRef.current >= SUSTAINED_FRAMES) {
          onStop();
          setElapsedMs(Date.now() - startTimeRef.current);
          setPhase("result");
        }
      } else {
        matchCountRef.current = Math.max(0, matchCountRef.current - 1);
      }
    }
  }, [sensorData, phase, onStop]);

  if (phase === "intro") {
    return (
      <div class="challenge-panel">
        <h2 class="challenge-panel__title">Accuracy Challenge</h2>
        <p class="challenge-panel__desc">
          Match the <strong>{MOTION_LABELS[motion]}</strong> pattern again —
          this time you need{" "}
          <strong>{Math.round(ACCURACY_THRESHOLD * 100)}%</strong> accuracy!
        </p>
        <button class="btn btn--start" onClick={handleBegin}>
          Begin
        </button>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div class="accuracy">
        <div class="accuracy__badge">
          Accuracy Mode — {Math.round(ACCURACY_THRESHOLD * 100)}% required
        </div>
        <MatchMeter score={matchScore} gameState="running" />
        <ReferenceChart pattern={referencePattern} motion={motion} />
        <LiveChart
          key={chartKey}
          sensorData={sensorData}
          running={true}
          startTime={startTimeRef.current}
          pairingSessionId={pairingSessionId}
          onNewPairing={onNewPairing}
        />
      </div>
    );
  }

  return (
    <div class="challenge-panel">
      <div class="challenge-panel__score challenge-panel__score--success">
        Matched!
      </div>
      <p class="challenge-panel__desc">
        You matched {MOTION_LABELS[motion]} with high accuracy!
      </p>
      <button
        class="btn btn--start"
        onClick={() => onComplete({ type: "accuracy", score: 100, elapsedMs })}
      >
        Continue
      </button>
    </div>
  );
}
