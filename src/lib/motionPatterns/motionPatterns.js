const SAMPLE_RATE = 10;
const DURATION = 5;
const NUM_SAMPLES = SAMPLE_RATE * DURATION;

export const MOTIONS = ["walking", "running", "jumping", "steps"];

export const MOTION_LABELS = {
  walking: "Walking",
  running: "Running",
  jumping: "Jumping",
  steps: "Walking Up Steps",
};

export function randomMotion() {
  return MOTIONS[Math.floor(Math.random() * MOTIONS.length)];
}

export function generatePattern(motionType) {
  const generators = { walking: genWalking, running: genRunning, jumping: genJumping, steps: genSteps };
  return (generators[motionType] || genWalking)();
}

function noise(amp) {
  return (Math.random() - 0.5) * 2 * amp;
}

function r4(v) {
  return Math.round(v * 10000) / 10000;
}

function genWalking() {
  const freq = 1.7 + Math.random() * 0.3;
  const labels = [], ax = [], ay = [], az = [];

  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    labels.push(t);
    const p = 2 * Math.PI * freq * t;

    ax.push(r4(0.8 * Math.sin(p * 0.5) + noise(0.3)));
    ay.push(r4(2.5 * Math.sin(p) + 0.8 * Math.sin(p * 2) + noise(0.4)));
    az.push(r4(1.2 * Math.sin(p + Math.PI / 4) + noise(0.3)));
  }

  return { labels, acceleration: { x: ax, y: ay, z: az } };
}

function genRunning() {
  const freq = 2.6 + Math.random() * 0.4;
  const labels = [], ax = [], ay = [], az = [];

  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    labels.push(t);
    const p = 2 * Math.PI * freq * t;

    ax.push(r4(2.0 * Math.sin(p * 0.5) + noise(0.8)));
    ay.push(r4(6.0 * Math.abs(Math.sin(p)) + 2.0 * Math.sin(p * 2) + noise(1.0)));
    az.push(r4(3.0 * Math.sin(p + Math.PI / 3) + noise(0.6)));
  }

  return { labels, acceleration: { x: ax, y: ay, z: az } };
}

function genJumping() {
  const period = 2.0 + Math.random() * 0.5;
  const labels = [], ax = [], ay = [], az = [];

  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    labels.push(t);
    const c = (t % period) / period;

    let x, y, z;
    if (c < 0.15) {
      x = noise(0.5);
      y = -3.0 * Math.sin((c / 0.15) * Math.PI) + noise(0.5);
      z = noise(0.5);
    } else if (c < 0.25) {
      const lp = (c - 0.15) / 0.1;
      x = noise(1.0);
      y = 15.0 * Math.sin(lp * Math.PI) + noise(1.0);
      z = noise(1.0);
    } else if (c < 0.55) {
      x = noise(0.3);
      y = -0.5 + noise(0.3);
      z = noise(0.3);
    } else if (c < 0.7) {
      const lp = (c - 0.55) / 0.15;
      x = noise(1.5);
      y = 18.0 * Math.sin(lp * Math.PI) + noise(1.5);
      z = noise(1.5);
    } else {
      const rp = (c - 0.7) / 0.3;
      x = noise(0.5) * (1 - rp);
      y = 3.0 * Math.exp(-rp * 5) * Math.sin(rp * 8 * Math.PI) + noise(0.5);
      z = noise(0.5) * (1 - rp);
    }

    ax.push(r4(x));
    ay.push(r4(y));
    az.push(r4(z));
  }

  return { labels, acceleration: { x: ax, y: ay, z: az } };
}

function genSteps() {
  const freq = 1.3 + Math.random() * 0.3;
  const labels = [], ax = [], ay = [], az = [];

  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    labels.push(t);
    const p = 2 * Math.PI * freq * t;

    ax.push(r4(0.8 * Math.sin(p * 0.5) + noise(0.4)));
    ay.push(r4(3.5 * Math.sin(p) + 1.5 * Math.abs(Math.sin(p)) + 1.0 * Math.sin(p * 2) + noise(0.5)));
    az.push(r4(1.5 * Math.sin(p + Math.PI / 3) + noise(0.4)));
  }

  return { labels, acceleration: { x: ax, y: ay, z: az } };
}
