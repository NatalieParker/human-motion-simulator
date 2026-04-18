const mockCompletionCreate = jest.fn();
const mockEnv = {};

class MockOpenAI {
  constructor() {
    this.chat = { completions: { create: mockCompletionCreate } };
  }
}

jest.mock("openai", () => ({
  __esModule: true,
  default: MockOpenAI,
}));

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
    mockEnv.VITE_OPENAI_API_KEY = "key";
    mockEnv.VITE_OPENAI_MODEL = "gpt-4o-mini";
  });

  it("analyzeMotion parses JSON from completion text", async () => {
    mockCompletionCreate.mockResolvedValue({
      choices: [{ message: { content: '{"detected":true,"motion":"walking","confidence":0.9,"description":"ok"}' } }],
    });
    const mod = loadModule();
    const result = await mod.analyzeMotion([{ x: 1, y: 2, z: 3 }]);
    expect(result.motion).toBe("walking");
  });

  it("throws when completion has no JSON", async () => {
    mockCompletionCreate.mockResolvedValue({
      choices: [{ message: { content: "plain text" } }],
    });
    const mod = loadModule();
    await expect(mod.analyzeMotion([{ x: 1, y: 2, z: 3 }])).rejects.toThrow("No JSON in response");
  });
});
