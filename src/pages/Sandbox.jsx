import { useState, useEffect, useRef, useMemo } from "preact/hooks";
import { signalRef, sensorDataRef, set, onValue } from "../lib/firebase";
import { classifyLocalMotion } from "../lib/motionMatcher/motionMatcher";
import { captureSnapshot } from "../lib/chartSnapshot/chartSnapshot";
import { LiveChart } from "../components/LiveChart/LiveChart";
import { PatternCard } from "../components/PatternCard/PatternCard";
import { QrFooter } from "../components/QrFooter/QrFooter";
import { initDesktopPairingSession, resetDesktopPairingSession } from "../lib/sessionChannel/sessionChannel";
import { usePortalGameData } from "../lib/usePortalGameData/usePortalGameData";
import "../styles/sandbox.css";

const DETECTION_INTERVAL_MS = 4000;
const DETECTION_WINDOW = 30;
const MAX_SAVED_PATTERNS = 60;

function normalizeSavedPatterns(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id:
        typeof item.id === "string" && item.id
          ? item.id
          : `${Number(item.timestamp || Date.now())}-${Math.random().toString(36).slice(2, 8)}`,
      localMotion: typeof item.localMotion === "string" ? item.localMotion : "unknown",
      snapshot: typeof item.snapshot === "string" ? item.snapshot : "",
      timestamp: Number(item.timestamp || Date.now()),
      dataWindow: Array.isArray(item.dataWindow) ? item.dataWindow : [],
      aiResult:
        item.aiResult && typeof item.aiResult === "object" && !Array.isArray(item.aiResult)
          ? item.aiResult
          : null,
    }));
}

export function SandboxPage() {
  const [pairingSessionId, setPairingSessionId] = useState(null);
  const [running, setRunning] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [sessionSamples, setSessionSamples] = useState([]);
  const [snippetStart, setSnippetStart] = useState(0);
  const [previewSnapshot, setPreviewSnapshot] = useState("");
  const [isPinnedScrub, setIsPinnedScrub] = useState(false);
  const { data: portalData, isLoading: portalLoading, mergeAndPersist } = usePortalGameData();

  const startTimeRef = useRef(Date.now());
  const dataBufferRef = useRef([]);
  const lastCheckRef = useRef(0);
  const chartKeyRef = useRef(0);
  const hasLoadedPortalPatternsRef = useRef(false);

  useEffect(() => {
    const id = initDesktopPairingSession();
    setPairingSessionId(id);
    set(signalRef, "stop");
  }, []);

  useEffect(() => {
    if (!pairingSessionId) return;
    const unsubscribe = onValue(sensorDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSensorData(data);
    });
    return () => unsubscribe();
  }, [pairingSessionId]);

  useEffect(() => {
    if (portalLoading || hasLoadedPortalPatternsRef.current) return;
    setPatterns((prev) =>
      prev.length > 0 ? prev : normalizeSavedPatterns(portalData.sandbox_patterns)
    );
    hasLoadedPortalPatternsRef.current = true;
  }, [portalData, portalLoading]);

  useEffect(() => {
    if (!hasLoadedPortalPatternsRef.current) return;
    mergeAndPersist({
      sandbox_patterns: patterns.slice(0, MAX_SAVED_PATTERNS),
    });
  }, [patterns]);

  function handleNewPairing() {
    const id = resetDesktopPairingSession();
    setPairingSessionId(id);
    set(signalRef, "stop");
  }

  useEffect(() => {
    if (!running || !sensorData) return;

    const a = sensorData.acceleration || {};
    dataBufferRef.current.push({
      x: a.x || 0,
      y: a.y || 0,
      z: a.z || 0,
      t: sensorData.timestamp || Date.now(),
    });
    setSessionSamples((prev) => {
      const next = [
        ...prev,
        {
          x: a.x || 0,
          y: a.y || 0,
          z: a.z || 0,
          t: sensorData.timestamp || Date.now(),
        },
      ];
      const clipped = next.slice(-600);
      if (!isPinnedScrub) {
        const maxStart = Math.max(0, clipped.length - DETECTION_WINDOW);
        setSnippetStart(maxStart);
      }
      return clipped;
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
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            localMotion: result.motion,
            snapshot,
            timestamp: Date.now(),
            dataWindow: slice,
            aiResult: null,
          },
          ...prev,
        ].slice(0, MAX_SAVED_PATTERNS));
      }
    }
  }, [sensorData, running]);

  const selectedWindow = useMemo(
    () => sessionSamples.slice(snippetStart, snippetStart + DETECTION_WINDOW),
    [sessionSamples, snippetStart]
  );

  useEffect(() => {
    if (selectedWindow.length < DETECTION_WINDOW) {
      setPreviewSnapshot("");
      return;
    }
    const timer = setTimeout(() => {
      setPreviewSnapshot(captureSnapshot(selectedWindow));
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedWindow]);

  function handleStart() {
    set(signalRef, "start");
    setRunning(true);
    startTimeRef.current = Date.now();
    dataBufferRef.current = [];
    setSessionSamples([]);
    setSnippetStart(0);
    setPreviewSnapshot("");
    setIsPinnedScrub(false);
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

  function handleDeletePattern(patternId) {
    setPatterns((prev) => prev.filter((p) => p.id !== patternId));
  }

  function handleSaveAiResult(patternId, aiResult) {
    setPatterns((prev) =>
      prev.map((p) => (p.id === patternId ? { ...p, aiResult } : p))
    );
  }

  function handleSnippetStartChange(e) {
    setSnippetStart(Number(e.target.value));
    setIsPinnedScrub(true);
  }

  function handleGrabSnippet() {
    if (selectedWindow.length < DETECTION_WINDOW) return;
    const result = classifyLocalMotion(selectedWindow);
    const estimatedMotion =
      result.detected && result.motion !== "stationary" ? result.motion : "unknown";
    const snapshot = previewSnapshot || captureSnapshot(selectedWindow);
    setPatterns((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        localMotion: estimatedMotion,
        snapshot,
        timestamp: Date.now(),
        dataWindow: selectedWindow,
        aiResult: null,
      },
      ...prev,
    ].slice(0, MAX_SAVED_PATTERNS));
  }

  return (
    <div class="sandbox">
      <div class="sandbox__top-bar">
        <h1>Sandbox Mode</h1>
        <div class="sandbox__top-actions">
          <QrFooter sessionId={pairingSessionId} onNewPairing={handleNewPairing} />
          <a class="btn btn--secondary" href="index.html">Main Menu</a>
        </div>
      </div>

      <section class="sandbox-intro">
        <p class="sandbox-intro__summary">
          Sandbox lets you explore free-form phone movement and see how raw acceleration patterns
          are detected and labeled over time.
        </p>
        <ol class="sandbox-intro__steps">
          <li>Pair your phone, then press <strong>Start</strong> to stream live sensor data.</li>
          <li>Use the scrubber to capture interesting snippets and compare detected patterns.</li>
          <li>Send snippets to OpenAI for analysis and learning, and compare openAI's analysis to your own.</li>
        </ol>
      </section>

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
        pairingSessionId={pairingSessionId}
        onNewPairing={handleNewPairing}
      />

      <div class="sandbox__scrubber">
        <h2>Snippet Scrubber</h2>
        <p class="sandbox__scrubber-help">
          Scroll through recorded graph data, choose a segment, and tag it with your own
          motion estimate.
        </p>
        <input
          class="sandbox__slider"
          type="range"
          min="0"
          max={Math.max(0, sessionSamples.length - DETECTION_WINDOW)}
          value={snippetStart}
          onInput={handleSnippetStartChange}
          disabled={sessionSamples.length < DETECTION_WINDOW}
        />
        <div class="sandbox__scrubber-meta">
          <span>
            Window: {selectedWindow.length > 0 ? snippetStart : 0} -{" "}
            {selectedWindow.length > 0 ? snippetStart + selectedWindow.length - 1 : 0}
          </span>
          <span>Total samples: {sessionSamples.length}</span>
        </div>
        <div class="sandbox__scrubber-actions">
          <button
            class="btn btn--start"
            onClick={handleGrabSnippet}
            disabled={selectedWindow.length < DETECTION_WINDOW}
          >
            Grab Snippet
          </button>
        </div>
        {previewSnapshot ? (
          <img
            class="sandbox__preview"
            src={previewSnapshot}
            alt="Selected snippet preview"
          />
        ) : (
          <div class="sandbox__preview-empty">
            Record more data to enable snippet preview.
          </div>
        )}
      </div>

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
            <PatternCard
              key={p.id || `${p.timestamp}-${i}`}
              pattern={p}
              onDelete={handleDeletePattern}
              onSaveAiResult={handleSaveAiResult}
            />
          ))}
        </div>
      )}
    </div>
  );
}
