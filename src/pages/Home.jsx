import "./Home.css";

export function HomePage() {
  return (
    <main class="home">
      <h1 class="home__title">Human Motion Simulator</h1>

      <section class="home__cards">
        <a class="home-card home-card--link" href="train.html">
          <span class="home-card__title">Learn</span>
          <span class="home-card__desc">Match your motion to the target pattern</span>
        </a>

        <a class="home-card home-card--link" href="sandbox.html">
          <span class="home-card__title">Explore</span>
          <span class="home-card__desc">Try free-form accelerometer exploration</span>
        </a>
      </section>
      <p class="home__pairing-hint">
        Open Learn or Explore to show a QR code that pairs one phone to this computer for that session.
      </p>
    </main>
  );
}
