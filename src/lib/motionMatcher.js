const SAMPLE_RATE = 10;

export function extractReferenceFeatures(pattern) {
  const a = pattern.acceleration;
  const mags = a.x.map((_, i) =>
    Math.sqrt(a.x[i] ** 2 + a.y[i] ** 2 + a.z[i] ** 2)
  );
  return extractFeaturesFromMagnitudes(mags);
}

export function extractLiveFeatures(magnitudes) {
  return extractFeaturesFromMagnitudes(magnitudes);
}

function extractFeaturesFromMagnitudes(mags) {
  const n = mags.length;
  if (n < 5) return { rms: 0, peakRate: 0, peakAmp: 0, maxPeak: 0 };

  const rms = Math.sqrt(mags.reduce((s, v) => s + v * v, 0) / n);

  const peaks = [];
  for (let i = 1; i < n - 1; i++) {
    if (mags[i] > mags[i - 1] && mags[i] > mags[i + 1] && mags[i] > rms * 0.5) {
      peaks.push(i);
    }
  }

  const duration = n / SAMPLE_RATE;
  const peakRate = peaks.length / duration;
  const peakAmp = peaks.length > 0
    ? peaks.reduce((s, i) => s + mags[i], 0) / peaks.length
    : 0;
  const maxPeak = Math.max(...mags);

  return { rms, peakRate, peakAmp, maxPeak };
}

export function computeMatchScore(live, ref) {
  const rmsScore = scoreFeature(live.rms, ref.rms, 0.6);
  const peakRateScore = scoreFeature(live.peakRate, ref.peakRate, 0.5);
  const peakAmpScore = scoreFeature(live.peakAmp, ref.peakAmp, 0.6);
  const maxPeakScore = scoreFeature(live.maxPeak, ref.maxPeak, 0.7);

  return rmsScore * 0.3 + peakRateScore * 0.3 + peakAmpScore * 0.2 + maxPeakScore * 0.2;
}

function scoreFeature(live, ref, relTolerance) {
  if (ref === 0) return live < 0.5 ? 1 : 0;
  const tolerance = Math.max(ref * relTolerance, 0.5);
  const diff = Math.abs(live - ref);
  return Math.max(0, 1 - diff / tolerance);
}
