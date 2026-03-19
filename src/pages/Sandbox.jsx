import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { signalRef, sensorDataRef, set, onValue } from "../lib/firebase";
import { analyzeMotion } from "../lib/gemini";
import { captureSnapshot } from "../lib/chartSnapshot";
import { LiveChart } from "../components/LiveChart/LiveChart";
import { PatternCard } from "../components/PatternCard/PatternCard";
import "../styles/sandbox.css";

const ANALYSIS_INTERVAL_MS = 4000;
const ANALYSIS_WINDOW = 30;

export function SandboxPage() {
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [error, setError] = useState(null);

  const startTimeRef = useRef(Date.now());
  const dataBufferRef = useRef([]);
  const lastAnalysisRef = useRef(0);
  const analyzingRef = useRef(false);
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

  const runAnalysis = useCallback(async (window) => {
    analyzingRef.current = true;
    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeMotion(window);
      if (result.detected && result.motion !== "stationary") {
        const snapshot = captureSnapshot(window);
        setPatterns((prev) => [
          { ...result, snapshot, timestamp: Date.now() },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error("Gemini analysis failed:", err);
      setError(err.message || "Analysis failed");
    }

    analyzingRef.current = false;
    setAnalyzing(false);
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
      now - lastAnalysisRef.current >= ANALYSIS_INTERVAL_MS &&
      !analyzingRef.current &&
      dataBufferRef.current.length >= ANALYSIS_WINDOW
    ) {
      lastAnalysisRef.current = now;
      const slice = dataBufferRef.current.slice(-ANALYSIS_WINDOW);
      runAnalysis(slice);
    }
  }, [sensorData, running, runAnalysis]);

  function handleStart() {
    set(signalRef, "start");
    setRunning(true);
    startTimeRef.current = Date.now();
    dataBufferRef.current = [];
    lastAnalysisRef.current = 0;
    chartKeyRef.current++;
    setError(null);
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
      <h1>Sandbox Mode</h1>

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
        {analyzing && <span class="sandbox__analyzing">Analyzing...</span>}
        {error && <span class="sandbox__error">{error}</span>}
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
