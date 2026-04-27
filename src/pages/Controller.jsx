import { useState, useEffect, useRef, useCallback, useMemo } from "preact/hooks";
import { signalRef, sensorDataRef, set, onValue } from "../lib/firebase";
import { round, fmt } from "../lib/format";
import { StatusBadge } from "../components/StatusBadge/StatusBadge";
import { QrFooter } from "../components/QrFooter/QrFooter";
import { getControllerSessionFromUrl } from "../lib/sessionChannel/sessionChannel";
import "../styles/controller.css";

const SEND_INTERVAL_MS = 100;

export function ControllerPage() {
  const sessionId = useMemo(() => getControllerSessionFromUrl(), []);
  const [sensorEnabled, setSensorEnabled] = useState(false);
  const [status, setStatus] = useState({ text: "Sensor not enabled", variant: "idle" });
  const [latestReading, setLatestReading] = useState(null);
  const [logs, setLogs] = useState([]);

  const collectingRef = useRef(false);
  const lastSendTimeRef = useRef(0);

  const appendLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
    console.log(msg);
  }, []);

  const onDeviceMotion = useCallback((event) => {
    const now = Date.now();
    if (now - lastSendTimeRef.current < SEND_INTERVAL_MS) return;
    lastSendTimeRef.current = now;

    const a = event.acceleration || { x: 0, y: 0, z: 0 };

    const payload = {
      acceleration: { x: round(a.x), y: round(a.y), z: round(a.z) },
      timestamp: now,
    };

    void set(sensorDataRef, payload).catch((err) => {
      appendLog(`Failed to write sensor_data: ${err.message}`);
    });
    setLatestReading(payload);

    const msg = `CONTROLLER DATA SENT: accel(${payload.acceleration.x}, ${payload.acceleration.y}, ${payload.acceleration.z})`;
    appendLog(msg);
  }, [appendLog]);

  useEffect(() => {
    const unsubscribe = onValue(signalRef, (snapshot) => {
      const signal = snapshot.val();

      if (signal === "start" && sensorEnabled && !collectingRef.current) {
        collectingRef.current = true;
        setStatus({ text: "Collecting data\u2026", variant: "collecting" });
        appendLog("\u25b6 Started collecting sensor data.");
        window.addEventListener("devicemotion", onDeviceMotion);
      } else if (signal === "stop" && collectingRef.current) {
        collectingRef.current = false;
        window.removeEventListener("devicemotion", onDeviceMotion);
        setStatus({ text: "Stopped \u2013 waiting for start signal\u2026", variant: "ready" });
        appendLog("\u25a0 Stopped collecting.");
      } else if (signal === "start" && !sensorEnabled) {
        setStatus({ text: "Tap 'Enable Sensors' first!", variant: "idle" });
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("devicemotion", onDeviceMotion);
    };
  }, [sensorEnabled, onDeviceMotion, appendLog]);

  async function handleEnableSensors() {
    try {
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== "granted") {
          setStatus({ text: "Permission denied \u2013 please allow motion access", variant: "stopped" });
          return;
        }
      }
    } catch (err) {
      setStatus({ text: "Permission error: " + err.message, variant: "stopped" });
      return;
    }

    setSensorEnabled(true);
    setStatus({ text: "Waiting for start signal\u2026", variant: "ready" });
    appendLog("Sensor permission granted. Waiting for main page signal.");
  }

  return (
    <div class="controller">
      <h1>Controller (Mobile)</h1>
      <QrFooter sessionId={sessionId} buttonLabel="Pairing Info" />

      <div class="controller__status">
        <StatusBadge text={status.text} variant={status.variant} />
      </div>

      <button
        class="controller__enable-btn"
        disabled={sensorEnabled}
        onClick={handleEnableSensors}
      >
        {sensorEnabled ? "Sensors Enabled \u2713" : "Enable Sensors"}
      </button>

      <div class="controller__data-panel">
        <h2>Latest Reading</h2>
        <DataRow label="accel x" value={latestReading?.acceleration?.x} />
        <DataRow label="accel y" value={latestReading?.acceleration?.y} />
        <DataRow label="accel z" value={latestReading?.acceleration?.z} />
      </div>

      <Log entries={logs} />
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div class="data-row">
      <span class="data-row__label">{label}</span>
      <span class="data-row__value">{fmt(value)}</span>
    </div>
  );
}

function Log({ entries }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div class="controller__log" ref={logRef}>
      {entries.map((entry, i) => (
        <div key={i}>{entry}</div>
      ))}
    </div>
  );
}
