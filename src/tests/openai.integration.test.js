const OpenAI = require("openai").default;

const API_KEY = process.env.VITE_OPENAI_API_KEY || "";
const MODEL = process.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
const hasOpenAiConfig = Boolean(API_KEY);
const describeOpenAi = hasOpenAiConfig ? describe : describe.skip;

describeOpenAi("openai live integration", () => {
  it("gets a real response from Chat Completions", async () => {
    const client = new OpenAI({ apiKey: API_KEY });
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 12,
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
    });

    const text = completion.choices?.[0]?.message?.content?.trim() || "";
    expect(text.length).toBeGreaterThan(0);
  });
});
