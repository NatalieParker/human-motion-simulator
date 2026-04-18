export const LEARN_CONCEPTS = [
  {
    id: "direction-axis-change",
    title: "Direction vs. Acceleration Axes",
    summary: "Changing phone direction changes axis signs and magnitudes, not the physics itself.",
    href: "level-direction.html",
    conceptTitle: "Direction changes axis traces, not the motion itself",
    conceptText:
      "When you move your phone left versus right, the graph can flip sign on an axis because axis direction is relative to phone orientation. The physical motion can be similar even when one axis line goes positive in one direction and negative in the other.",
    experimentText:
      "Move your phone left, then right. Try to keep both movements similar in speed and distance.",
    questionText:
      "Describe what changed when you switched directions. Which axis changed, and how? Explain why moving left and right affects the graph this way.",
  },
  {
    id: "acceleration-vs-motion",
    title: "Acceleration vs Motion",
    summary: "Moving does not always mean acceleration; acceleration is change in velocity.",
    href: "level-acceleration-vs-motion.html",
    conceptTitle: "Moving is not the same as accelerating",
    conceptText:
      "Acceleration means velocity is changing: speeding up, slowing down, or changing direction. You can move at steady speed with nearly flat acceleration, and you can be briefly still while acceleration spikes during a sudden push.",
    experimentText:
      "Move your phone steadily in one direction, then stop and quickly move it again. Compare the smooth part to the start/stop moments.",
    questionText:
      "Where did acceleration change the most: during steady motion, during starts/stops, or both? Explain why moving alone does not always produce high acceleration.",
  },
  {
    id: "sharp-peaks",
    title: "Sharp Peaks From Sudden Motion",
    summary: "Flicks, jumps, and quick stops create spikes in acceleration data.",
    href: "level-sharp-peaks.html",
    conceptTitle: "Sudden actions make sharp acceleration peaks",
    conceptText:
      "Quick changes in velocity create large acceleration spikes. A flick, jump-like jerk, or hard stop compresses lots of change into a short time, which appears as sharp peaks on one or more axes.",
    experimentText:
      "Try three motions: a gentle move, a quick flick, and a quick stop. Keep each motion separate so the peaks are easy to compare.",
    questionText:
      "Which motion produced the sharpest peaks, and why? Explain what graph features tell you the velocity changed quickly.",
  },
  {
    id: "positive-vs-negative",
    title: "Positive vs Negative Acceleration",
    summary: "Learn why axis values flip sign when movement direction flips.",
    href: "level-positive-negative.html",
    conceptTitle: "Positive and negative values represent opposite axis directions",
    conceptText:
      "Each axis has a positive and negative direction. If you reverse movement along the same axis, the sign often flips even when motion size is similar.",
    experimentText:
      "Move the phone repeatedly in one axis direction, then reverse and repeat similarly. Watch one axis line for sign changes.",
    questionText:
      "Which axis flipped sign most clearly? Explain what a positive-to-negative switch means physically.",
  },
  {
    id: "acceleration-vs-deceleration",
    title: "Acceleration vs Deceleration",
    summary: "Compare speeding up and slowing down patterns in the graph.",
    href: "level-accel-vs-decel.html",
    conceptTitle: "Speeding up and slowing down are both acceleration",
    conceptText:
      "Acceleration includes both increasing speed and decreasing speed. Deceleration is acceleration opposite the motion direction, so its axis pattern can differ in sign from speeding up.",
    experimentText:
      "Start with a slow movement that speeds up, then intentionally slow to a stop. Repeat once to compare patterns.",
    questionText:
      "How did the graph differ between speeding up and slowing down? Describe sign or magnitude differences and why they occur.",
  },
  {
    id: "acceleration-with-g",
    title: "Acceleration With G",
    summary: "Tilt your phone on each axis to see how gravity appears in acceleration-with-G data.",
    href: "level-acceleration-with-g.html",
    conceptTitle: "Gravity contributes a steady acceleration component",
    conceptText:
      "Acceleration with gravity includes the gravitational vector, so tilting the phone redistributes gravity across axes. Even without deliberate motion, axis values can shift as orientation changes.",
    experimentText:
      "Hold the phone mostly still and slowly tilt it forward/backward and side-to-side. Observe smooth axis shifts tied to orientation.",
    questionText:
      "Which axis changed most while tilting, and why can values change even when motion is slow or nearly still?",
  },
  {
    id: "g-baseline-stillness",
    title: "Match a Mystery Motion Trace",
    summary: "Observe pre-made acceleration data (without G), guess the movement, then recreate it.",
    href: "level-g-baseline-stillness.html",
    conceptTitle: "Read a sample trace, then try to match it",
    conceptText:
      "This level starts with a pre-made acceleration trace (without gravity) from a short phone action. Your job is to interpret what movement might have created the pattern, then try your own version to match the shape.",
    observationPrompt:
      "What movement do you think created this trace? Describe the action sequence (for example: rotate left-right, quick upward toss and catch, sharp stop).",
    sampleDataNote:
      "Reference data (acceleration without G): short multi-axis rotation with a quick return.",
    sampleData: [
      { t: 0, x: 0.02, y: 0.04, z: 0.01 },
      { t: 120, x: 0.18, y: 0.22, z: -0.08 },
      { t: 240, x: 0.35, y: 0.41, z: -0.14 },
      { t: 360, x: 0.58, y: 0.62, z: -0.21 },
      { t: 480, x: 0.41, y: 0.28, z: -0.1 },
      { t: 600, x: 0.12, y: -0.04, z: 0.06 },
      { t: 720, x: -0.16, y: -0.3, z: 0.14 },
      { t: 840, x: -0.43, y: -0.55, z: 0.22 },
      { t: 960, x: -0.5, y: -0.61, z: 0.25 },
      { t: 1080, x: -0.21, y: -0.26, z: 0.11 },
      { t: 1200, x: 0.06, y: 0.02, z: -0.02 },
      { t: 1320, x: 0.01, y: 0.01, z: 0.0 },
    ],
    experimentText:
      "Try to reproduce the same overall pattern using your own movement. There is no exact target score; focus on making your graph look similar in timing, direction changes, and peak shape.",
    questionText:
      "How did your attempt compare with the sample? Which parts were easiest or hardest to match, and what does that tell you about interpreting acceleration-only data?",
  },
  {
    id: "g-axis-transfer",
    title: "Gravity Transfers Across Axes",
    summary: "Tilting moves gravity contribution from one axis to another.",
    href: "level-g-axis-transfer.html",
    conceptTitle: "Tilting redistributes gravity",
    conceptText:
      "When you rotate the phone, gravity does not disappear, but its contribution shifts between x/y/z axes. One axis can decrease while another increases as the gravity vector is reprojected.",
    experimentText:
      "Slowly rotate from flat to upright, then rotate side to side. Watch which axis grows while another shrinks.",
    questionText:
      "Describe one rotation where gravity clearly moved from one axis to another. What happened to each axis and why?",
  },
  {
    id: "with-g-vs-without-g",
    title: "With-G vs Without-G During Motion",
    summary: "Compare traces to separate gravity baseline from motion-driven changes.",
    href: "level-with-g-vs-without-g.html",
    conceptTitle: "Separate gravity from motion acceleration",
    conceptText:
      "Acceleration-without-G emphasizes motion changes, while acceleration-with-G includes both motion and gravity. Comparing both helps you tell whether a signal is orientation-related or movement-related.",
    experimentText:
      "Do two actions: first tilt slowly with little translation, then shake briefly. Compare how each action appears in acceleration and acceleration-with-G data.",
    questionText:
      "In your data, which parts were mostly gravity/orientation effects and which parts were motion effects? How did the two acceleration modes help you decide?",
  },
  {
    id: "fast-vs-slow-acceleration",
    title: "Fast vs Slow Acceleration",
    summary: "Compare how quickly changing velocity shapes peak size and sharpness.",
    href: "level-fast-vs-slow-acceleration.html",
    conceptTitle: "Rate of change controls acceleration intensity",
    conceptText:
      "Faster velocity changes create larger, sharper acceleration peaks. Slower transitions spread the same overall movement over more time, producing smaller and smoother curves.",
    experimentText:
      "Repeat the same direction change twice: first very slowly, then very quickly. Try to keep direction and range similar so speed is the main difference.",
    questionText:
      "How did the graph differ between your slow and fast attempts? Describe changes in peak height, width, and timing, and explain what that reveals about rate of change.",
  },
  {
    id: "complex-circular-motion",
    title: "Acceleration in Complex Circular Motion",
    summary: "Circular movement combines changing direction and axis coupling.",
    href: "level-complex-circular-motion.html",
    conceptTitle: "Complex motion creates coordinated multi-axis traces",
    conceptText:
      "In circular motion, velocity direction changes continuously, so acceleration appears across multiple axes at once. The resulting traces are coordinated and phase-shifted rather than single isolated spikes.",
    experimentText:
      "Move your phone in smooth circles, then try tighter and faster circles. Observe how x, y, and z interact over time.",
    questionText:
      "What patterns did you notice during circular motion? Explain how multiple axes changed together and why curved movement produces that behavior.",
  },
  {
    id: "freefall-acceleration",
    title: "Freefall Acceleration",
    summary: "Observe acceleration with-G and without-G when the phone is briefly in freefall.",
    href: "level-freefall.html",
    conceptTitle: "Freefall creates distinctive acceleration behavior",
    conceptText:
      "During brief freefall, measured acceleration patterns change sharply because support forces drop. Handle this safely over a soft surface with a very small toss.",
    experimentText:
      "Very carefully do a tiny toss over a bed or cushion. Compare that moment to normal hand-held movement. Safety first.",
    questionText:
      "What changed during the brief freefall moment compared with normal movement? Which axes showed the clearest difference and why?",
  },
];

export const LEARN_CONCEPTS_BY_ID = Object.fromEntries(
  LEARN_CONCEPTS.map((c) => [c.id, c])
);
