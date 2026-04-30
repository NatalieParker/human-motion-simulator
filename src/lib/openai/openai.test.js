const mockEnv = {};

jest.mock("../env.js", () => ({
  env: mockEnv,
}));

describe("openai unit", () => {
  function loadModule() {
    jest.resetModules();
    return require("./openai");
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.VITE_OPENAI_PROXY_URL = "/api/ai/openai";
    mockEnv.VITE_OPENAI_MODEL = "gpt-4o-mini";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it("analyzeMotion parses JSON from completion text", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"detected":true,"motion":"walking","confidence":0.9,"description":"ok"}' } }],
      }),
    });
    const mod = loadModule();
    const result = await mod.analyzeMotion([{ x: 1, y: 2, z: 3 }]);
    expect(result.motion).toBe("walking");
  });

  it("throws when completion has no JSON", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "plain text" } }],
      }),
    });
    const mod = loadModule();
    await expect(mod.analyzeMotion([{ x: 1, y: 2, z: 3 }])).rejects.toThrow("No JSON in response");
  });
});
