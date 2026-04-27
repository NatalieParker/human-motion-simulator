import { useState, useEffect, useRef } from "preact/hooks";
import { LiveChart } from "../LiveChart/LiveChart";
import "./StillnessChallenge.css";

const DURATION = 20;
const THRESHOLD = 0.5;

export function StillnessChallenge({
  sensorData,
  pairingSessionId,
  onNewPairing,
  onComplete,
  onStart,
  onStop,
}) {
  const [phase, setPhase] = useState("intro");
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [livePercent, setLivePercent] = useState(100);
  const [chartKey, setChartKey] = useState(0);

  const startTimeRef = useRef(Date.now());
  const samplesRef = useRef({ total: 0, within: 0 });
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;

  function handleBegin() {
    onStart();
    startTimeRef.current = Date.now();
    setChartKey((k) => k + 1);
    samplesRef.current = { total: 0, within: 0 };
    setPhase("active");
  }

  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onStopRef.current();
          const s = samplesRef.current;
          const pct = s.total > 0 ? Math.round((s.within / s.total) * 100) : 0;
          setScore(pct);
          setPhase("result");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "active" || !sensorData) return;
    const a = sensorData.acceleration || {};
    samplesRef.current.total++;
    if (
      Math.abs(a.x || 0) <= THRESHOLD &&
      Math.abs(a.y || 0) <= THRESHOLD &&
      Math.abs(a.z || 0) <= THRESHOLD
    ) {
      samplesRef.current.within++;
    }
    const s = samplesRef.current;
    setLivePercent(s.total > 0 ? Math.round((s.within / s.total) * 100) : 100);
  }, [sensorData, phase]);

  if (phase === "intro") {
    return (
      <div class="challenge-panel">
        <h2 class="challenge-panel__title">Stillness Challenge</h2>
        <p class="challenge-panel__desc">
          Hold your phone perfectly still for {DURATION} seconds. Keep all
          acceleration as close to zero as possible.
        </p>
        <button class="btn btn--start" onClick={handleBegin}>
          Begin
        </button>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div class="stillness">
        <div class="stillness__header">
          <span class="stillness__timer">{timeLeft}s</span>
          <span class="stillness__live-pct">{livePercent}% within threshold</span>
        </div>
        <div class="stillness__progress-track">
          <div
            class="stillness__progress-fill"
            style={{ width: `${((DURATION - timeLeft) / DURATION) * 100}%` }}
          />
        </div>
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
      <div class="challenge-panel__score">{score}%</div>
      <p class="challenge-panel__desc">
        of your data stayed within the stillness threshold
      </p>
      <button
        class="btn btn--start"
        onClick={() => onComplete({ type: "stillness", score })}
      >
        Continue
      </button>
    </div>
  );
}
