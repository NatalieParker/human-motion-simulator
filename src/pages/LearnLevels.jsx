import { useMemo } from "preact/hooks";
import { QrFooter } from "../components/QrFooter/QrFooter";
import { LEVEL_DIRECTION_ID, getLearnCompletionMap } from "../lib/learnProgress";
import { initDesktopPairingSession, resetDesktopPairingSession } from "../lib/sessionChannel";
import "../styles/learn.css";

const LEVELS = [
  {
    id: LEVEL_DIRECTION_ID,
    title: "Direction vs. Acceleration Axes",
    description: "Changing phone direction changes axis signs and magnitudes, not the physics itself.",
    href: "level-direction.html",
  },
  {
    id: "gravity-vs-linear",
    title: "Acceleration With vs. Without Gravity",
    description: "Understand why gravity appears in one sensor stream and is removed in another.",
    href: null,
  },
  {
    id: "axis-decomposition",
    title: "Three Axes, One Motion",
    description: "See how one movement contributes differently to X, Y, and Z.",
    href: null,
  },
];

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
        <a class="learn-btn learn-btn--secondary" href="./">
          Main Menu
        </a>
      </header>

      <p class="learn-page__intro">
        Choose a concept card to start a focused mini-lesson. Completed cards stay marked as
        completed even if you retry the level.
      </p>

      <section class="learn-grid">
        {LEVELS.map((level) => {
          const completed = completion[level.id] === true;
          const className = [
            "learn-card",
            completed ? "learn-card--completed" : "",
            !level.href ? "learn-card--locked" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const content = (
            <>
              <div>
                <h2>{level.title}</h2>
                <p>{level.description}</p>
              </div>
              <div class="learn-card__footer">
                <span class={`learn-badge ${completed ? "learn-badge--done" : ""}`}>
                  {completed ? "Completed" : "Not completed"}
                </span>
                <span class="learn-card__cta">{level.href ? "Open level" : "Mocked up"}</span>
              </div>
            </>
          );

          return level.href ? (
            <a key={level.id} class={className} href={level.href}>
              {content}
            </a>
          ) : (
            <article key={level.id} class={className}>
              {content}
            </article>
          );
        })}
      </section>

      <QrFooter sessionId={sessionId} onNewPairing={handleNewPairing} />
    </main>
  );
}
