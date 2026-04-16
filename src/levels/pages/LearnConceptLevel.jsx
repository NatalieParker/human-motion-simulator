import { useMemo, useState, useEffect, useRef } from "preact/hooks";
import { LiveChart } from "../../components/LiveChart/LiveChart";
import { ReferenceChart } from "../components/ReferenceChart";
import { QrFooter } from "../../components/QrFooter/QrFooter";
import { signalRef, sensorDataRef, set, onValue } from "../../lib/firebase";
import { markLevelCompleted } from "../lib/learnProgress";
import { initDesktopPairingSession, resetDesktopPairingSession } from "../../lib/sessionChannel";
import { coachConceptAnswer } from "../../lib/openai";
import "../styles/learn.css";

export function LearnConceptLevel({ concept, pageTitle }) {
  const sessionId = useMemo(() => initDesktopPairingSession(), []);
  const [running, setRunning] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [samples, setSamples] = useState([]);
  const [answer, setAnswer] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionOpen, setQuestionOpen] = useState(false);
  const [observationAnswer, setObservationAnswer] = useState("");
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
    setObservationAnswer("");
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
        conceptTitle: concept.conceptTitle,
        conceptText: concept.conceptText,
        experimentText: concept.experimentText,
        question: concept.questionText,
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
    markLevelCompleted(concept.id);
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
        <h1>{pageTitle}</h1>
        <a class="learn-btn learn-btn--secondary" href="levels.html">
          Back to Learn
        </a>
      </header>

      <section class="concept-card">
        <h2>{concept.conceptTitle}</h2>
        <p>{concept.conceptText}</p>
      </section>

      {Array.isArray(concept.sampleData) && concept.sampleData.length > 0 && (
        <section class="experiment-card">
          <h3>Reference acceleration data (without G)</h3>
          {concept.sampleDataNote && <p>{concept.sampleDataNote}</p>}
          <ReferenceChart sampleData={concept.sampleData} />
          {concept.observationPrompt && (
            <>
              <p class="learn-observation-label">{concept.observationPrompt}</p>
              <textarea
                class="question-card__input"
                rows={4}
                value={observationAnswer}
                onInput={(e) => setObservationAnswer(e.target.value)}
                placeholder="Write your movement guess..."
              />
            </>
          )}
        </section>
      )}

      <section class="experiment-card">
        <h3>Try this experiment</h3>
        <p>{concept.experimentText}</p>
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
          <p>{concept.questionText}</p>
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
