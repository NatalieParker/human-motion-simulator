import { useMemo, useState, useEffect, useRef } from "preact/hooks";
import { LiveChart } from "../components/LiveChart/LiveChart";
import { QrFooter } from "../components/QrFooter/QrFooter";
import { signalRef, sensorDataRef, set, onValue } from "../lib/firebase";
import { markLevelCompleted } from "../lib/learnProgress";
import { initDesktopPairingSession, resetDesktopPairingSession } from "../lib/sessionChannel";
import { coachConceptAnswer } from "../lib/openai";
import "../styles/learn.css";

const CONCEPT_TITLE = "Direction changes axis traces, not the motion itself";
const CONCEPT_TEXT =
  "When you move your phone left versus right, the graph can flip sign on an axis because axis direction is relative to phone orientation. The physical motion can be similar even when one axis line goes positive in one direction and negative in the other.";
const EXPERIMENT_TEXT =
  "Move your phone left, then right. Try to keep both movements similar in speed and distance.";
const QUESTION_TEXT =
  "Describe what changed when you switched directions. Which axis changed, and how? Explain why moving left and right affects the graph this way.";

export function LearnDirectionLevelPage() {
  const sessionId = useMemo(() => initDesktopPairingSession(), []);
  const [running, setRunning] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [samples, setSamples] = useState([]);
  const [answer, setAnswer] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionOpen, setQuestionOpen] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    set(signalRef, "stop");
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(sensorDataRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setSensorData(data);
      if (!running) return;
      const a = data.acceleration || {};
      setSamples((prev) => [
        ...prev.slice(-199),
        { x: a.x ?? 0, y: a.y ?? 0, z: a.z ?? 0, t: data.timestamp || Date.now() },
      ]);
    });
    return () => unsubscribe();
  }, [running]);

  function handleStart() {
    setError("");
    setAiFeedback("");
    setQuestionOpen(false);
    setSamples([]);
    startTimeRef.current = Date.now();
    set(signalRef, "start");
    setRunning(true);
  }

  function handleStop() {
    set(signalRef, "stop");
    setRunning(false);
  }

  function handleRetry() {
    handleStop();
    setSamples([]);
    setAnswer("");
    setAiFeedback("");
    setError("");
    setQuestionOpen(false);
  }

  async function handleAskAI() {
    if (!answer.trim()) {
      setError("Please answer the comprehension question first.");
      return;
    }
    setAiLoading(true);
    setError("");
    try {
      const feedback = await coachConceptAnswer({
        conceptTitle: CONCEPT_TITLE,
        conceptText: CONCEPT_TEXT,
        experimentText: EXPERIMENT_TEXT,
        question: QUESTION_TEXT,
        userAnswer: answer.trim(),
        sampleWindow: samples.slice(-40),
      });
      setAiFeedback(feedback);
    } catch (err) {
      setError(err.message || "AI feedback failed");
    } finally {
      setAiLoading(false);
    }
  }

  function handleFinishLevel() {
    markLevelCompleted("direction-axis-change");
    set(signalRef, "stop");
    window.location.href = "levels.html";
  }

  function handleNewPairing() {
    resetDesktopPairingSession();
    window.location.reload();
  }

  return (
    <main class="learn-page">
      <header class="learn-page__header">
        <h1>Learn Level 1</h1>
        <a class="learn-btn learn-btn--secondary" href="levels.html">
          Back to Learn
        </a>
      </header>

      <section class="concept-card">
        <h2>{CONCEPT_TITLE}</h2>
        <p>{CONCEPT_TEXT}</p>
      </section>

      <section class="experiment-card">
        <h3>Try this experiment</h3>
        <p>{EXPERIMENT_TEXT}</p>
        <div class="learn-actions">
          {!running ? (
            <button class="learn-btn learn-btn--start" onClick={handleStart}>
              Start
            </button>
          ) : (
            <button class="learn-btn learn-btn--stop" onClick={handleStop}>
              Stop
            </button>
          )}
          <button class="learn-btn learn-btn--secondary" onClick={handleRetry}>
            Retry
          </button>
          <button class="learn-btn" onClick={() => setQuestionOpen(true)}>
            Finish
          </button>
        </div>
      </section>

      <LiveChart sensorData={sensorData} running={running} startTime={startTimeRef.current} />

      {questionOpen && (
        <section class="question-card">
          <h3>Comprehension check</h3>
          <p>{QUESTION_TEXT}</p>
          <textarea
            class="question-card__input"
            rows={5}
            value={answer}
            onInput={(e) => setAnswer(e.target.value)}
            placeholder="Type your explanation..."
          />
          <div class="learn-actions">
            <button class="learn-btn" onClick={handleAskAI} disabled={aiLoading}>
              {aiLoading ? "AI thinking..." : "Get AI feedback"}
            </button>
            <button class="learn-btn learn-btn--secondary" onClick={handleRetry}>
              Retry level
            </button>
            <button class="learn-btn learn-btn--start" onClick={handleFinishLevel}>
              Finish and return to Learn
            </button>
          </div>
          {error && <p class="learn-error">{error}</p>}
          {aiFeedback && <p class="learn-feedback">{aiFeedback}</p>}
        </section>
      )}

      <QrFooter sessionId={sessionId} onNewPairing={handleNewPairing} />
    </main>
  );
}
