import { useState, useEffect, useRef } from "preact/hooks";
import { signalRef, sensorDataRef, set, onValue } from "../lib/firebase";
import { classifyLocalMotion } from "../lib/motionMatcher";
import { captureSnapshot } from "../lib/chartSnapshot";
import { LiveChart } from "../components/LiveChart/LiveChart";
import { PatternCard } from "../components/PatternCard/PatternCard";
import "../styles/sandbox.css";

const DETECTION_INTERVAL_MS = 4000;
const DETECTION_WINDOW = 30;

export function SandboxPage() {
  const [running, setRunning] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [patterns, setPatterns] = useState([]);

  const startTimeRef = useRef(Date.now());
  const dataBufferRef = useRef([]);
  const lastCheckRef = useRef(0);
  const chartKeyRef = useRef(0);

  useEffect(() => {
    set(signalRef, "stop");
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(sensorDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSensorData(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!running || !sensorData) return;

    const a = sensorData.acceleration || {};
    dataBufferRef.current.push({
      x: a.x || 0,
      y: a.y || 0,
      z: a.z || 0,
      t: sensorData.timestamp || Date.now(),
    });

    if (dataBufferRef.current.length > 200) {
      dataBufferRef.current = dataBufferRef.current.slice(-200);
    }

    const now = Date.now();
    if (
      now - lastCheckRef.current >= DETECTION_INTERVAL_MS &&
      dataBufferRef.current.length >= DETECTION_WINDOW
    ) {
      lastCheckRef.current = now;
      const slice = dataBufferRef.current.slice(-DETECTION_WINDOW);
      const result = classifyLocalMotion(slice);

      if (result.detected && result.motion !== "stationary") {
        const snapshot = captureSnapshot(slice);
        setPatterns((prev) => [
          {
            localMotion: result.motion,
            snapshot,
            timestamp: Date.now(),
            dataWindow: slice,
          },
          ...prev,
        ]);
      }
    }
  }, [sensorData, running]);

  function handleStart() {
    set(signalRef, "start");
    setRunning(true);
    startTimeRef.current = Date.now();
    dataBufferRef.current = [];
    lastCheckRef.current = 0;
    chartKeyRef.current++;
  }

  function handleStop() {
    set(signalRef, "stop");
    setRunning(false);
  }

  function handleClear() {
    setPatterns([]);
  }

  return (
    <div class="sandbox">
      <div class="sandbox__top-bar">
        <h1>Sandbox Mode</h1>
        <a class="btn btn--secondary" href="./">Main Game</a>
      </div>

      <div class="sandbox__controls">
        {!running ? (
          <button class="btn btn--start" onClick={handleStart}>
            Start
          </button>
        ) : (
          <button class="btn btn--stop" onClick={handleStop}>
            Stop
          </button>
        )}
      </div>

      <LiveChart
        key={chartKeyRef.current}
        sensorData={sensorData}
        running={running}
        startTime={startTimeRef.current}
      />

      <div class="sandbox__patterns-header">
        <h2>Detected Patterns</h2>
        {patterns.length > 0 && (
          <button class="sandbox__clear-btn" onClick={handleClear}>
            Clear All
          </button>
        )}
      </div>

      {patterns.length === 0 ? (
        <div class="sandbox__empty">
          {running
            ? "Listening for motion patterns\u2026"
            : "Start the session to begin detecting motion patterns."}
        </div>
      ) : (
        <div class="sandbox__patterns-list">
          {patterns.map((p, i) => (
            <PatternCard key={`${p.timestamp}-${i}`} pattern={p} />
          ))}
        </div>
      )}
    </div>
  );
}
