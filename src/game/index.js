import kaplay from "kaplay";

const MOTION_CONFIG = {
  walking: { freq: 1.8, amp: 15, label: "Walking", color: [56, 189, 248] },
  running: { freq: 3.0, amp: 25, label: "Running", color: [248, 113, 113] },
  jumping: { freq: 0.7, amp: 60, label: "Jumping", color: [74, 222, 128] },
  steps:   { freq: 1.3, amp: 20, label: "Walking Up Steps", color: [251, 146, 60] },
};

export function initGame(canvas) {
  const k = kaplay({
    canvas,
    width: 800,
    height: 300,
    background: [15, 23, 42],
  });

  const state = {
    motion: "walking",
    matchScore: 0,
    gameState: "idle",
  };

  k.scene("game", () => {
    const groundY = 230;

    k.add([k.rect(800, 2), k.pos(0, groundY), k.color(100, 116, 139)]);

    const head = k.add([
      k.circle(14),
      k.pos(400, groundY - 55),
      k.anchor("center"),
      k.color(56, 189, 248),
    ]);

    const body = k.add([
      k.rect(6, 24),
      k.pos(400, groundY - 35),
      k.anchor("center"),
      k.color(56, 189, 248),
    ]);

    const leftLeg = k.add([
      k.rect(4, 18),
      k.pos(396, groundY - 10),
      k.anchor("top"),
      k.color(56, 189, 248),
    ]);

    const rightLeg = k.add([
      k.rect(4, 18),
      k.pos(404, groundY - 10),
      k.anchor("top"),
      k.color(56, 189, 248),
    ]);

    const leftArm = k.add([
      k.rect(4, 14),
      k.pos(393, groundY - 42),
      k.anchor("top"),
      k.color(56, 189, 248),
    ]);

    const rightArm = k.add([
      k.rect(4, 14),
      k.pos(407, groundY - 42),
      k.anchor("top"),
      k.color(56, 189, 248),
    ]);

    const label = k.add([
      k.text("", { size: 24 }),
      k.pos(400, 25),
      k.anchor("center"),
      k.color(226, 232, 240),
    ]);

    const statusText = k.add([
      k.text("Press Start to begin", { size: 14 }),
      k.pos(400, 55),
      k.anchor("center"),
      k.color(148, 163, 184),
    ]);

    const scoreText = k.add([
      k.text("", { size: 16 }),
      k.pos(400, 270),
      k.anchor("center"),
      k.color(148, 163, 184),
    ]);

    const parts = [head, body, leftLeg, rightLeg, leftArm, rightArm];
    const baseX = 400;
    const baseY = {
      head: groundY - 55,
      body: groundY - 35,
      leg: groundY - 10,
      arm: groundY - 42,
    };

    function setCharColor(r, g, b) {
      const c = k.rgb(r, g, b);
      parts.forEach((p) => (p.color = c));
    }

    function resetCharPos() {
      head.pos = k.vec2(baseX, baseY.head);
      body.pos = k.vec2(baseX, baseY.body);
      leftLeg.pos = k.vec2(baseX - 4, baseY.leg);
      rightLeg.pos = k.vec2(baseX + 4, baseY.leg);
      leftArm.pos = k.vec2(baseX - 7, baseY.arm);
      rightArm.pos = k.vec2(baseX + 7, baseY.arm);
    }

    k.onUpdate(() => {
      const cfg = MOTION_CONFIG[state.motion] || MOTION_CONFIG.walking;
      label.text = `Target: ${cfg.label}`;
      setCharColor(...cfg.color);

      const t = k.time();

      if (state.gameState === "running") {
        let yOff = 0;
        let legSwing = 0;
        let armSwing = 0;

        if (state.motion === "walking") {
          yOff = Math.sin(t * 2 * Math.PI * cfg.freq) * cfg.amp;
          legSwing = Math.sin(t * 2 * Math.PI * cfg.freq) * 6;
          armSwing = -legSwing * 0.6;
        } else if (state.motion === "running") {
          yOff = Math.abs(Math.sin(t * 2 * Math.PI * cfg.freq)) * cfg.amp;
          legSwing = Math.sin(t * 2 * Math.PI * cfg.freq) * 10;
          armSwing = -legSwing * 0.8;
        } else if (state.motion === "jumping") {
          const cycle = (t * cfg.freq) % 1;
          if (cycle < 0.2) {
            yOff = -8 * Math.sin((cycle / 0.2) * Math.PI);
          } else if (cycle < 0.7) {
            const air = (cycle - 0.2) / 0.5;
            yOff = 4 * air * (1 - air) * cfg.amp;
          } else {
            const land = (cycle - 0.7) / 0.3;
            yOff = -5 * Math.sin(land * Math.PI * 2) * Math.exp(-land * 3);
          }
          legSwing = 0;
          armSwing = yOff > 10 ? -4 : 0;
        } else if (state.motion === "steps") {
          yOff = Math.abs(Math.sin(t * 2 * Math.PI * cfg.freq)) * cfg.amp;
          legSwing = Math.sin(t * 2 * Math.PI * cfg.freq) * 5;
          armSwing = -legSwing * 0.5;
        }

        head.pos.y = baseY.head - yOff;
        body.pos.y = baseY.body - yOff;
        leftLeg.pos = k.vec2(baseX - 4 + legSwing, baseY.leg - yOff);
        rightLeg.pos = k.vec2(baseX + 4 - legSwing, baseY.leg - yOff);
        leftArm.pos = k.vec2(baseX - 7 + armSwing, baseY.arm - yOff);
        rightArm.pos = k.vec2(baseX + 7 - armSwing, baseY.arm - yOff);

        const pct = Math.round(state.matchScore * 100);
        scoreText.text = `Match: ${pct}%`;
        const r = Math.round(248 - state.matchScore * 174);
        const g = Math.round(113 + state.matchScore * 109);
        scoreText.color = k.rgb(r, g, 100);

        statusText.text = "Perform the motion with your phone!";
        statusText.color = k.rgb(148, 163, 184);
      } else if (state.gameState === "matched") {
        const bounce = Math.abs(Math.sin(t * 5)) * 20;
        head.pos.y = baseY.head - bounce;
        body.pos.y = baseY.body - bounce;
        leftLeg.pos = k.vec2(baseX - 4, baseY.leg - bounce);
        rightLeg.pos = k.vec2(baseX + 4, baseY.leg - bounce);
        leftArm.pos = k.vec2(baseX - 12, baseY.arm - bounce - 8);
        rightArm.pos = k.vec2(baseX + 12, baseY.arm - bounce - 8);

        scoreText.text = "MATCHED!";
        scoreText.color = k.rgb(74, 222, 128);
        statusText.text = "Great job! Motion detected!";
        statusText.color = k.rgb(74, 222, 128);
      } else {
        resetCharPos();
        scoreText.text = "";
        statusText.text = "Press Start to begin";
        statusText.color = k.rgb(148, 163, 184);
      }
    });
  });

  k.go("game");

  return {
    setMotion(type) { state.motion = type; },
    setMatchScore(score) { state.matchScore = score; },
    setGameState(gs) { state.gameState = gs; },
    destroy() { k.quit(); },
  };
}
