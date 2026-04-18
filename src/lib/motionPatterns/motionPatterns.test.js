const { MOTIONS, MOTION_LABELS, randomMotion, generatePattern } = require("./motionPatterns");

describe("motionPatterns", () => {
  it("randomMotion returns only supported motions", () => {
    for (let i = 0; i < 20; i++) {
      expect(MOTIONS).toContain(randomMotion());
    }
  });

  it("has labels for each motion", () => {
    MOTIONS.forEach((motion) => {
      expect(typeof MOTION_LABELS[motion]).toBe("string");
      expect(MOTION_LABELS[motion].length).toBeGreaterThan(0);
    });
  });

  it("generates a complete pattern for every motion and default path", () => {
    [...MOTIONS, "unknown"].forEach((motion) => {
      const pattern = generatePattern(motion);
      expect(pattern.labels.length).toBe(50);
      expect(pattern.acceleration.x.length).toBe(50);
      expect(pattern.acceleration.y.length).toBe(50);
      expect(pattern.acceleration.z.length).toBe(50);
    });
  });
});
