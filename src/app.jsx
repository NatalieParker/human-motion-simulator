import { useState, useEffect, useRef } from "preact/hooks";
import { signalRef, sensorDataRef, set, onValue } from "./lib/firebase";
import { generatePattern, randomMotion } from "./lib/motionPatterns";
import {
  extractReferenceFeatures,
  extractLiveFeatures,
  computeMatchScore,
} from "./lib/motionMatcher";
import { MatchMeter } from "./components/MatchMeter/MatchMeter";
import { ReferenceChart } from "./components/ReferenceChart/ReferenceChart";
import { LiveChart } from "./components/LiveChart/LiveChart";
import { ChallengeOverlay } from "./components/ChallengeOverlay/ChallengeOverlay";
import { QrFooter } from "./components/QrFooter/QrFooter";
import { reviewLearningAnswer, explainLearningQuestion } from "./lib/gemini";
import "./styles/dashboard.css";

const MATCH_THRESHOLD = 0.55;
const SUSTAINED_FRAMES = 20;
const CHALLENGE_CHANCE = 0.5;
const CHALLENGE_TYPES = ["stillness", "rhythm", "accuracy"];
const DEV_MODE_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_MODE === "true";
const MOTION_QUESTIONS = {
  walking: [
    "What makes this graph look like walking instead of running?",
    "Which axis seems most rhythmic for this walking pattern?",
    "What do the acceleration peaks in the graph represent?",
  ],
  running: [
    "What graph clue suggests this is running and not walking?",
    "Why do running graphs usually show more frequent peaks?",
    "Why might the running graph show a larger peak than the walking graph?",
  ],
  jumping: [
    "What single feature on the graph makes jumping easier to identify?",
    "Why might jumping show larger vertical spikes than walking?",
    "What does the large acceleration spike in the graph represent?",
  ],
  steps: [
    "What pattern might indicate walking up steps instead of flat walking?",
    "How can you tell stair motion from running in this graph?",
    "Why do acceleration peaks look different on stairs than on flat ground?",
  ],
};

export function App() {
  const devFromQuery =
    DEV_MODE_ENABLED &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("dev") === "1";
  const [motion, setMotion] = useState(() => randomMotion());
  const [referencePattern, setReferencePattern] = useState(() => generatePattern(motion));
  const [gameState, setGameState] = useState("idle");
  const [matchScore, setMatchScore] = useState(0);
  const [sensorData, setSensorData] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const [challengeType, setChallengeType] = useState(null);
  const [devMode, setDevMode] = useState(
    () =>
      DEV_MODE_ENABLED &&
      (devFromQuery ||
      (typeof window !== "undefined" && localStorage.getItem("dev_mode_auto_match") === "1")
      )
  );
  const [learningOpen, setLearningOpen] = useState(false);
  const [learningQuestion, setLearningQuestion] = useState("");
  const [learningAnswer, setLearningAnswer] = useState("");
  const [learningFeedback, setLearningFeedback] = useState("");
  const [learningReviewedAnswer, setLearningReviewedAnswer] = useState("");
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState(null);
  const [matchedUserPattern, setMatchedUserPattern] = useState(null);

  const startTimeRef = useRef(Date.now());
  const liveBufferRef = useRef([]);
  const liveAxisBufferRef = useRef([]);
  const matchCountRef = useRef(0);
  const smoothedScoreRef = useRef(0);
  const refFeaturesRef = useRef(null);
  const devMatchTimerRef = useRef(null);

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
    if (gameState !== "running" || !sensorData || devMode) return;

    const a = sensorData.acceleration || {};
    const sample = {
      x: Number((a.x || 0).toFixed(3)),
      y: Number((a.y || 0).toFixed(3)),
      z: Number((a.z || 0).toFixed(3)),
    };
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);

    const buf = liveBufferRef.current;
    const axisBuf = liveAxisBufferRef.current;
    buf.push(mag);
    axisBuf.push(sample);
    if (buf.length > 50) buf.shift();
    if (axisBuf.length > 120) axisBuf.shift();

    if (buf.length >= 20 && refFeaturesRef.current) {
      const liveFeatures = extractLiveFeatures(buf);
      const raw = computeMatchScore(liveFeatures, refFeaturesRef.current);

      const smoothed = smoothedScoreRef.current * 0.7 + raw * 0.3;
      smoothedScoreRef.current = smoothed;
      setMatchScore(smoothed);

      if (smoothed >= MATCH_THRESHOLD) {
        matchCountRef.current++;
        if (matchCountRef.current >= SUSTAINED_FRAMES) {
          const recent = axisBuf.slice(-40);
          setMatchedUserPattern({
            x: recent.map((p) => p.x),
            y: recent.map((p) => p.y),
            z: recent.map((p) => p.z),
          });
          set(signalRef, "stop");
          setGameState("matched");
        }
      } else {
        matchCountRef.current = Math.max(0, matchCountRef.current - 1);
      }
    }
  }, [sensorData, gameState, devMode]);

  useEffect(() => {
    if (gameState !== "running" || !devMode) return;

    const script = [0.2, 0.4, 0.62, 0.78, 0.92, 1];
    let i = 0;
    devMatchTimerRef.current = setInterval(() => {
      setMatchScore(script[i]);
      i++;
      if (i >= script.length) {
        clearInterval(devMatchTimerRef.current);
        devMatchTimerRef.current = null;
        const ref = referencePattern.acceleration;
        const startIdx = Math.max(0, ref.x.length - 40);
        setMatchedUserPattern({
          x: ref.x.slice(startIdx),
          y: ref.y.slice(startIdx),
          z: ref.z.slice(startIdx),
        });
        set(signalRef, "stop");
        setGameState("matched");
      }
    }, 300);

    return () => {
      if (devMatchTimerRef.current) {
        clearInterval(devMatchTimerRef.current);
        devMatchTimerRef.current = null;
      }
    };
  }, [gameState, devMode, referencePattern]);

  function handleStart() {
    set(signalRef, "start");
    setGameState("running");
    startTimeRef.current = Date.now();
    liveBufferRef.current = [];
    liveAxisBufferRef.current = [];
    matchCountRef.current = 0;
    smoothedScoreRef.current = 0;
    setMatchScore(0);
    setMatchedUserPattern(null);
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

  useEffect(() => {
    if (gameState !== "matched") return;
    const questions = MOTION_QUESTIONS[motion] || MOTION_QUESTIONS.walking;
    const q = questions[Math.floor(Math.random() * questions.length)];
    setLearningQuestion(q);
    setLearningAnswer("");
    setLearningFeedback("");
    setLearningReviewedAnswer("");
    setLearningError(null);
    setLearningOpen(false);
  }, [gameState, motion]);

  function handleNewMotion() {
    set(signalRef, "stop");
    const next = randomMotion();
    setMotion(next);
    setReferencePattern(generatePattern(next));
    setGameState("idle");
    setMatchScore(0);
    setChallengeType(null);
    setLearningOpen(false);
    setLearningQuestion("");
    setLearningAnswer("");
    setLearningFeedback("");
    setLearningReviewedAnswer("");
    setLearningError(null);
    liveBufferRef.current = [];
    liveAxisBufferRef.current = [];
    matchCountRef.current = 0;
    smoothedScoreRef.current = 0;
    setMatchedUserPattern(null);
    setGameKey((k) => k + 1);
  }

  function handleChallengeComplete() {
    handleNewMotion();
  }

  function handleChallengeSkip() {
    set(signalRef, "stop");
    handleNewMotion();
  }

  function handleMatchedNext() {
    setLearningOpen(true);
    setLearningFeedback("");
    setLearningReviewedAnswer("");
    setLearningError(null);
  }

  function handleToggleDevMode() {
    if (!DEV_MODE_ENABLED) return;
    setDevMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("dev_mode_auto_match", next ? "1" : "0");
      }
      return next;
    });
  }

  async function handleReviewWithAI() {
    if (!learningAnswer.trim()) {
      setLearningError("Please type an answer first.");
      return;
    }
    setLearningLoading(true);
    setLearningError(null);
    try {
      const feedback = await reviewLearningAnswer({
        motion,
        question: learningQuestion,
        userAnswer: learningAnswer.trim(),
        targetPattern: referencePattern.acceleration,
        userPattern: matchedUserPattern,
      });
      setLearningFeedback(feedback);
      setLearningReviewedAnswer(learningAnswer.trim());
    } catch (err) {
      setLearningError(err.message || "AI review failed");
    } finally {
      setLearningLoading(false);
    }
  }

  async function handleAskAI() {
    setLearningLoading(true);
    setLearningError(null);
    try {
      const feedback = await explainLearningQuestion({
        motion,
        question: learningQuestion,
        targetPattern: referencePattern.acceleration,
        userPattern: matchedUserPattern,
      });
      setLearningFeedback(feedback);
      setLearningReviewedAnswer("");
    } catch (err) {
      setLearningError(err.message || "AI answer failed");
    } finally {
      setLearningLoading(false);
    }
  }

  function handleLearningNext() {
    setLearningOpen(false);
    if (Math.random() < CHALLENGE_CHANCE) {
      const type = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
      setChallengeType(type);
      setGameState("challenge");
      return;
    }
    handleNewMotion();
  }

  return (
    <div class="container">
      <div class="top-bar">
        <h1>Human Motion Simulator</h1>
        <div class="top-bar__actions">
          {DEV_MODE_ENABLED && (
            <button class="btn btn--secondary" onClick={handleToggleDevMode}>
              Dev: {devMode ? "On" : "Off"}
            </button>
          )}
          <a class="btn btn--secondary" href="./">Main Menu</a>
        </div>
      </div>

      <div style={{ display: gameState === "challenge" ? "none" : "block" }}>
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
          {gameState === "matched" && !learningOpen && (
            <button class="btn btn--start" onClick={handleMatchedNext}>
              Next
            </button>
          )}
        </div>
      </div>

      {gameState === "challenge" && (
        <ChallengeOverlay
          type={challengeType}
          sensorData={sensorData}
          referencePattern={referencePattern}
          motion={motion}
          onComplete={handleChallengeComplete}
          onSkip={handleChallengeSkip}
          onStart={() => set(signalRef, "start")}
          onStop={() => set(signalRef, "stop")}
        />
      )}

      {learningOpen && (
        <div class="learning-dialog__backdrop">
          <div class="learning-dialog">
            <h2 class="learning-dialog__title">Learning Checkpoint</h2>
            <p class="learning-dialog__motion">Motion: {motion}</p>
            <p class="learning-dialog__question">{learningQuestion}</p>

            {!learningFeedback && (
              <>
                <textarea
                  class="learning-dialog__input"
                  value={learningAnswer}
                  onInput={(e) => setLearningAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                />
                <div class="learning-dialog__actions">
                  <button
                    class="btn btn--secondary"
                    onClick={handleReviewWithAI}
                    disabled={learningLoading || !learningAnswer.trim()}
                  >
                    Review with AI
                  </button>
                  <button
                    class="btn btn--start"
                    onClick={handleAskAI}
                    disabled={learningLoading}
                  >
                    Ask AI
                  </button>
                </div>
              </>
            )}

            {learningLoading && <p class="learning-dialog__loading">AI is thinking...</p>}
            {learningError && <p class="learning-dialog__error">{learningError}</p>}

            {learningFeedback && (
              <div class="learning-dialog__result">
                {learningReviewedAnswer && (
                  <p class="learning-dialog__user-answer">
                    Your answer: {learningReviewedAnswer}
                  </p>
                )}
                <p>{learningFeedback}</p>
                <button class="btn btn--start" onClick={handleLearningNext}>
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <QrFooter />
    </div>
  );
}
