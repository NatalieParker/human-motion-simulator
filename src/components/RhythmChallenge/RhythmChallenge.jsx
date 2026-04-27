import { useState, useEffect, useRef } from "preact/hooks";
import "./RhythmChallenge.css";

const TOTAL_BEATS = 16;
const HIT_WINDOW_MS = 200;
const SPIKE_THRESHOLD = 3;
const SPIKE_COOLDOWN_MS = 300;

export function RhythmChallenge({ sensorData, onComplete, onStart, onStop }) {
  const [phase, setPhase] = useState("intro");
  const [bpm] = useState(() => 60 + Math.floor(Math.random() * 41));
  const [beatCount, setBeatCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [score, setScore] = useState(0);

  const beatTimesRef = useRef([]);
  const hitBeatsRef = useRef(new Set());
  const lastSpikeRef = useRef(0);
  const startTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const finishedRef = useRef(false);

  const beatInterval = 60000 / bpm;

  function handleBegin() {
    onStart();
    finishedRef.current = false;
    hitBeatsRef.current = new Set();
    startTimeRef.current = Date.now();

    const times = [];
    for (let i = 0; i < TOTAL_BEATS; i++) {
      times.push(startTimeRef.current + (i + 1) * beatInterval);
    }
    beatTimesRef.current = times;

    let count = 0;
    intervalRef.current = setInterval(() => {
      count++;
      setBeatCount(count);
      setFlash(true);
      setTimeout(() => setFlash(false), 120);

      if (count >= TOTAL_BEATS) {
        clearInterval(intervalRef.current);
        setTimeout(() => finish(), beatInterval * 0.5);
      }
    }, beatInterval);

    setPhase("active");
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onStop();
    const hits = hitBeatsRef.current.size;
    const pct = Math.round((hits / TOTAL_BEATS) * 100);
    setScore(pct);
    setHitCount(hits);
    setPhase("result");
  }

  useEffect(() => {
    if (phase !== "active" || !sensorData) return;
    const a = sensorData.acceleration || {};
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    const now = sensorData.timestamp || Date.now();

    if (mag >= SPIKE_THRESHOLD && now - lastSpikeRef.current > SPIKE_COOLDOWN_MS) {
      lastSpikeRef.current = now;
      for (let i = 0; i < beatTimesRef.current.length; i++) {
        if (hitBeatsRef.current.has(i)) continue;
        if (Math.abs(now - beatTimesRef.current[i]) <= HIT_WINDOW_MS) {
          hitBeatsRef.current.add(i);
          setHitCount(hitBeatsRef.current.size);
          break;
        }
      }
    }
  }, [sensorData, phase]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (phase === "intro") {
    return (
      <div class="challenge-panel">
        <h2 class="challenge-panel__title">Rhythm Challenge</h2>
        <p class="challenge-panel__desc">
          Shake your phone on each beat! Match {TOTAL_BEATS} beats at{" "}
          <strong>{bpm} BPM</strong>.
        </p>
        <button class="btn btn--start" onClick={handleBegin}>
          Begin
        </button>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div class="rhythm">
        <div class={`rhythm__pulse ${flash ? "rhythm__pulse--on" : ""}`} />
        <p class="rhythm__bpm">{bpm} BPM</p>
        <p class="rhythm__count">
          Beat {beatCount} / {TOTAL_BEATS}
        </p>
        <p class="rhythm__hits">{hitCount} hits</p>
      </div>
    );
  }

  return (
    <div class="challenge-panel">
      <div class="challenge-panel__score">{score}%</div>
      <p class="challenge-panel__desc">
        {hitCount} hits out of {TOTAL_BEATS} beats
      </p>
      <button
        class="btn btn--start"
        onClick={() => onComplete({ type: "rhythm", score, bpm })}
      >
        Continue
      </button>
    </div>
  );
}
