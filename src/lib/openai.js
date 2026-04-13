import OpenAI from "openai";

const SANDBOX_PROMPT = `You are analyzing accelerometer data from a smartphone in someone's pocket.
The data contains x, y, z acceleration values in m/s² sampled at 10Hz.

Determine if this data contains a recognizable human motion pattern.

Respond ONLY with a JSON object in this exact format (no markdown, no code fences):
{"detected":true,"motion":"walking","confidence":0.85,"description":"..."}

Valid motion values: "walking", "running", "jumping", "stairs", "stationary", "unknown"
Set detected to false if no clear motion pattern is present.

HARD REQUIREMENT for the "description" field:
It MUST begin with exactly: "This motion looks like [motion] with [confidence as percentage]% confidence."
Then continue with a brief technical explanation of what you observed in the data.
Example: "This motion looks like walking with 85% confidence. The data shows rhythmic oscillations at approximately 1.8Hz consistent with a walking gait."

Data:
`;

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";

function getClient() {
  if (!API_KEY) throw new Error("VITE_OPENAI_API_KEY is not set in .env");
  return new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true,
  });
}

async function completeText(prompt) {
  const openai = getClient();
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });
  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from OpenAI");
  return text;
}

export async function analyzeMotion(dataWindow) {
  const formatted = dataWindow
    .map((d) => `x:${d.x.toFixed(3)} y:${d.y.toFixed(3)} z:${d.z.toFixed(3)}`)
    .join("\n");

  const text = await completeText(SANDBOX_PROMPT + formatted);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  return JSON.parse(jsonMatch[0]);
}

function formatGraphSection(name, graph) {
  if (!graph || !Array.isArray(graph.x) || !Array.isArray(graph.y) || !Array.isArray(graph.z)) {
    return `${name}: unavailable`;
  }
  return `${name}:
X acceleration: ${graph.x.join(", ")}
Y acceleration: ${graph.y.join(", ")}
Z acceleration: ${graph.z.join(", ")}`;
}

function buildLearningReviewPrompt({ motion, question, userAnswer, targetPattern, userPattern }) {
  return `You are helping a student learn motion analysis from accelerometer graphs.

Goal:
- Explain why the user's answer is correct or not quite there yet.
- Only use the question, the user's answer, and the two graphs below.
- If you refer to a specific line, explicitly name the line as X acceleration, Y acceleration, or Z acceleration.
- Use plain text only. Do not use markdown, bullets, bold, italics, or special formatting.
- Keep the whole response to one paragraph maximum.
- Explain at a high school to college freshman reading level.

Required response start:
Begin with exactly either "Correct:" or "Not quite:"

Motion type: ${motion}
Question: ${question}
Student answer: ${userAnswer}

${formatGraphSection("Target pattern graph", targetPattern)}

${formatGraphSection("User pattern graph", userPattern)}`;
}

function buildLearningExplainPrompt({ motion, question, targetPattern, userPattern }) {
  return `You are helping a student understand accelerometer graph patterns.

Goal:
- Answer the question using only the question and the two graphs below.
- If you refer to a specific line, explicitly name the line as X acceleration, Y acceleration, or Z acceleration.
- Use plain text only. Do not use markdown, bullets, bold, italics, or special formatting.
- Keep the whole response to one paragraph maximum.
- Explain at a high school to college freshman reading level.

Motion type: ${motion}
Question: ${question}

${formatGraphSection("Target pattern graph", targetPattern)}

${formatGraphSection("User pattern graph", userPattern)}`;
}

export async function reviewLearningAnswer({
  motion,
  question,
  userAnswer,
  targetPattern,
  userPattern,
}) {
  const prompt = buildLearningReviewPrompt({
    motion,
    question,
    userAnswer,
    targetPattern,
    userPattern,
  });
  return completeText(prompt);
}

export async function explainLearningQuestion({
  motion,
  question,
  targetPattern,
  userPattern,
}) {
  const prompt = buildLearningExplainPrompt({
    motion,
    question,
    targetPattern,
    userPattern,
  });
  return completeText(prompt);
}

export async function coachConceptAnswer({
  conceptTitle,
  conceptText,
  experimentText,
  question,
  userAnswer,
  sampleWindow,
}) {
  const sampleSummary = Array.isArray(sampleWindow)
    ? sampleWindow
        .slice(-40)
        .map(
          (s) =>
            `x:${Number(s.x || 0).toFixed(3)} y:${Number(s.y || 0).toFixed(3)} z:${Number(s.z || 0).toFixed(3)}`
        )
        .join("\n")
    : "no samples";

  const prompt = `You are a patient physics tutor for a motion-learning game.

Concept title: ${conceptTitle}
Concept explanation: ${conceptText}
Experiment instructions: ${experimentText}
Comprehension question: ${question}
Student answer: ${userAnswer}

Recent accelerometer samples (x, y, z):
${sampleSummary}

Task:
- Decide whether the student understood the concept correctly.
- If mostly correct, reinforce the right intuition and add one deeper insight.
- If incomplete or incorrect, explain exactly what they missed and correct it.
- Reference axis behavior clearly (X/Y/Z, sign flips, magnitude changes) when relevant.
- Keep to one short paragraph.
- Start with exactly "Correct:" or "Not quite:".`;

  return completeText(prompt);
}
