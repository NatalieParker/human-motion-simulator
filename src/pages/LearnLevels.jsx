import { useMemo } from "preact/hooks";
import { QrFooter } from "../components/QrFooter/QrFooter";
import { getLearnCompletionMap } from "../levels/lib/learnProgress";
import { LEARN_CONCEPTS } from "../levels/lib/learnConcepts";
import { initDesktopPairingSession, resetDesktopPairingSession } from "../lib/sessionChannel/sessionChannel";
import { usePortalGameData } from "../lib/usePortalGameData/usePortalGameData";
import "../levels/styles/learn.css";

export function LearnLevelsPage() {
  const sessionId = useMemo(() => initDesktopPairingSession(), []);
  const { data: portalData } = usePortalGameData();
  const completion = useMemo(() => {
    const localCompletion = getLearnCompletionMap();
    const portalCompletion =
      portalData.learn_completion &&
      typeof portalData.learn_completion === "object" &&
      !Array.isArray(portalData.learn_completion)
        ? portalData.learn_completion
        : {};
    return { ...localCompletion, ...portalCompletion };
  }, [portalData]);

  function handleNewPairing() {
    resetDesktopPairingSession();
    window.location.reload();
  }

  return (
    <main class="learn-page">
      <header class="learn-page__header">
        <h1>Learn</h1>
        <div class="learn-page__header-actions">
          <QrFooter sessionId={sessionId} onNewPairing={handleNewPairing} />
          <a class="learn-btn learn-btn--secondary" href="index.html">
            Main Menu
          </a>
        </div>
      </header>

      <section class="learn-intro">
        <p class="learn-intro__summary">
          Learn mode breaks motion science into focused mini-lessons so you can connect movement
          ideas with real acceleration patterns.
        </p>
        <br></br>
        <p>Open any concept card to start a short guided lesson.</p>
      </section>

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
    </main>
  );
}
