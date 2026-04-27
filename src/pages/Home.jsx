import "./Home.css";

export function HomePage() {
  return (
    <main class="home">
      <h1 class="home__title">Acceleration Simulator</h1>

      <section class="home__cards">
        <a class="home-card home-card--link" href="levels.html">
          <span class="home-card__title">1. Learn</span>
          <span class="home-card__desc">
            Build motion intuition through short guided levels with concept checks and instant
            feedback.
          </span>
        </a>

        <a class="home-card home-card--link" href="train.html">
          <span class="home-card__title">2. Train</span>
          <span class="home-card__desc">
            Practice matching your phone acceleration to target human motion patterns with conceptual learning.
          </span>
        </a>

        <a class="home-card home-card--link" href="sandbox.html">
          <span class="home-card__title">3. Explore</span>
          <span class="home-card__desc">
            Freely test movements, inspect live sensor output, and capture motion snippets for your
            own analysis.
          </span>
        </a>
      </section>
      <p class="home__pairing-hint">
        Open Learn or Explore to show a QR code that pairs one phone to this computer for that session.
      </p>
    </main>
  );
}
