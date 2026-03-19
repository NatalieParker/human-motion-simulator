import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT = `You are analyzing accelerometer data from a smartphone in someone's pocket.
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

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeMotion(dataWindow) {
  if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY is not set in .env");
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const formatted = dataWindow.map((d) =>
    `x:${d.x.toFixed(3)} y:${d.y.toFixed(3)} z:${d.z.toFixed(3)}`
  ).join("\n");

  const result = await model.generateContent(PROMPT + formatted);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  return JSON.parse(jsonMatch[0]);
}
