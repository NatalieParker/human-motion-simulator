import { useMemo } from "preact/hooks";
import { QrFooter } from "../components/QrFooter/QrFooter";
import { getLearnCompletionMap } from "../levels/lib/learnProgress";
import { LEARN_CONCEPTS } from "../levels/lib/learnConcepts";
import { initDesktopPairingSession, resetDesktopPairingSession } from "../lib/sessionChannel/sessionChannel";
import "../levels/styles/learn.css";

export function LearnLevelsPage() {
  const sessionId = useMemo(() => initDesktopPairingSession(), []);
  const completion = useMemo(() => getLearnCompletionMap(), []);

  function handleNewPairing() {
    resetDesktopPairingSession();
    window.location.reload();
  }

  return (
    <main class="learn-page">
      <header class="learn-page__header">
        <h1>Learn</h1>
        <a class="learn-btn learn-btn--secondary" href="index.html">
          Main Menu
        </a>
      </header>

      <p class="learn-page__intro">
        Choose a concept card to start a focused mini-lesson. Completed cards stay marked as
        completed even if you retry the level.
      </p>

      <section class="learn-grid">
        {LEARN_CONCEPTS.map((level) => {
          const completed = completion[level.id] === true;
          const className = [
            "learn-card",
            completed ? "learn-card--completed" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <a key={level.id} class={className} href={level.href}>
              <div>
                <h2>{level.title}</h2>
                <p>{level.summary}</p>
              </div>
              <div class="learn-card__footer">
                <span class={`learn-badge ${completed ? "learn-badge--done" : ""}`}>
                  {completed ? "Completed" : "Not completed"}
                </span>
                <span class="learn-card__cta">Open level</span>
              </div>
            </a>
          );
        })}
      </section>

      <QrFooter sessionId={sessionId} onNewPairing={handleNewPairing} />
    </main>
  );
}
