const {
  extractReferenceFeatures,
  extractLiveFeatures,
  computeMatchScore,
  classifyLocalMotion,
} = require("./motionMatcher");

describe("motionMatcher", () => {
  it("extracts non-zero reference features from a pattern", () => {
    const ref = extractReferenceFeatures({
      acceleration: {
        x: [0, 1, 0, -1, 0],
        y: [0, 0.5, 0, -0.5, 0],
        z: [0, 0.2, 0, -0.2, 0],
      },
    });
    expect(ref.rms).toBeGreaterThan(0);
    expect(ref.maxPeak).toBeGreaterThan(0);
  });

  it("returns zeroed features for too-short live input", () => {
    expect(extractLiveFeatures([0, 1, 2])).toEqual({
      rms: 0,
      peakRate: 0,
      peakAmp: 0,
      maxPeak: 0,
    });
  });

  it("scores perfect match as 1", () => {
    const same = { rms: 1, peakRate: 2, peakAmp: 3, maxPeak: 4 };
    expect(computeMatchScore(same, same)).toBe(1);
  });

  it("classifies stationary and jumping patterns", () => {
    const stationary = Array.from({ length: 20 }, () => ({ x: 0, y: 0, z: 0 }));
    expect(classifyLocalMotion(stationary)).toEqual({
      detected: false,
      motion: "stationary",
    });

    const jumping = Array.from({ length: 20 }, (_, i) => ({
      x: i === 10 ? 10 : 0,
      y: 0,
      z: 0,
    }));
    expect(classifyLocalMotion(jumping).motion).toBe("jumping");
  });
});
