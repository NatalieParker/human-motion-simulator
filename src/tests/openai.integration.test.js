const PROXY_URL = process.env.VITE_OPENAI_PROXY_URL || "";
const MODEL = process.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
const describeOpenAi = PROXY_URL ? describe : describe.skip;

describeOpenAi("openai live integration", () => {
  it("gets a real response from proxy-backed Chat Completions", async () => {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 12,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
      }),
    });
    const completion = await res.json();
    if (!res.ok) {
      throw new Error(completion?.error || `Proxy request failed (${res.status})`);
    }

    const text = completion.choices?.[0]?.message?.content?.trim() || "";
    expect(text.length).toBeGreaterThan(0);
  });
});
