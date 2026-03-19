import { useState, useEffect, useRef } from "preact/hooks";
import { signalRef, sensorDataRef, set, onValue } from "./lib/firebase";
import { generatePattern, randomMotion } from "./lib/motionPatterns";
import {
  extractReferenceFeatures,
  extractLiveFeatures,
  computeMatchScore,
} from "./lib/motionMatcher";
import { GameCanvas } from "./components/GameCanvas/GameCanvas";
import { MatchMeter } from "./components/MatchMeter/MatchMeter";
import { ReferenceChart } from "./components/ReferenceChart/ReferenceChart";
import { LiveChart } from "./components/LiveChart/LiveChart";
import "./styles/dashboard.css";

const MATCH_THRESHOLD = 0.55;
const SUSTAINED_FRAMES = 20;

export function App() {
  const [motion, setMotion] = useState(() => randomMotion());
  const [referencePattern, setReferencePattern] = useState(() => generatePattern(motion));
  const [gameState, setGameState] = useState("idle");
  const [matchScore, setMatchScore] = useState(0);
  const [sensorData, setSensorData] = useState(null);
  const [gameKey, setGameKey] = useState(0);

  const startTimeRef = useRef(Date.now());
  const liveBufferRef = useRef([]);
  const matchCountRef = useRef(0);
  const smoothedScoreRef = useRef(0);
  const refFeaturesRef = useRef(null);

  useEffect(() => {
    set(signalRef, "stop");
  }, []);

  useEffect(() => {
    refFeaturesRef.current = extractReferenceFeatures(referencePattern);
  }, [referencePattern]);

  useEffect(() => {
    const unsubscribe = onValue(sensorDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSensorData(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (gameState !== "running" || !sensorData) return;

    const a = sensorData.acceleration || {};
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);

    const buf = liveBufferRef.current;
    buf.push(mag);
    if (buf.length > 50) buf.shift();

    if (buf.length >= 20 && refFeaturesRef.current) {
      const liveFeatures = extractLiveFeatures(buf);
      const raw = computeMatchScore(liveFeatures, refFeaturesRef.current);

      const smoothed = smoothedScoreRef.current * 0.7 + raw * 0.3;
      smoothedScoreRef.current = smoothed;
      setMatchScore(smoothed);

      if (smoothed >= MATCH_THRESHOLD) {
        matchCountRef.current++;
        if (matchCountRef.current >= SUSTAINED_FRAMES) {
          set(signalRef, "stop");
          setGameState("matched");
        }
      } else {
        matchCountRef.current = Math.max(0, matchCountRef.current - 1);
      }
    }
  }, [sensorData, gameState]);

  function handleStart() {
    set(signalRef, "start");
    setGameState("running");
    startTimeRef.current = Date.now();
    liveBufferRef.current = [];
    matchCountRef.current = 0;
    smoothedScoreRef.current = 0;
    setMatchScore(0);
    setGameKey((k) => k + 1);
  }

  function handleStop() {
    set(signalRef, "stop");
    setGameState("idle");
    setMatchScore(0);
    liveBufferRef.current = [];
    matchCountRef.current = 0;
    smoothedScoreRef.current = 0;
  }

  function handleNewMotion() {
    set(signalRef, "stop");
    const next = randomMotion();
    setMotion(next);
    setReferencePattern(generatePattern(next));
    setGameState("idle");
    setMatchScore(0);
    liveBufferRef.current = [];
    matchCountRef.current = 0;
    smoothedScoreRef.current = 0;
    setGameKey((k) => k + 1);
  }

  return (
    <div class="container">
      <h1>Human Motion Simulator</h1>

      <GameCanvas motion={motion} matchScore={matchScore} gameState={gameState} />

      <MatchMeter score={matchScore} gameState={gameState} />

      <ReferenceChart pattern={referencePattern} motion={motion} />

      <LiveChart
        key={gameKey}
        sensorData={sensorData}
        running={gameState === "running"}
        startTime={startTimeRef.current}
      />

      <div class="game-controls">
        {gameState === "idle" && (
          <>
            <button class="btn btn--start" onClick={handleStart}>
              Start
            </button>
            <button class="btn btn--secondary" onClick={handleNewMotion}>
              New Motion
            </button>
          </>
        )}
        {gameState === "running" && (
          <button class="btn btn--stop" onClick={handleStop}>
            Stop
          </button>
        )}
        {gameState === "matched" && (
          <button class="btn btn--start" onClick={handleNewMotion}>
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
