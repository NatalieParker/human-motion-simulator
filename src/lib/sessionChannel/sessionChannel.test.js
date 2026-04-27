const mockConfigureSessionChannel = jest.fn();
const mockClearSessionChannel = jest.fn();
const mockEnv = { BASE_URL: "/staticGames/demo/" };

jest.mock("../supabase/supabase", () => ({
  configureSessionChannel: mockConfigureSessionChannel,
  clearSessionChannel: mockClearSessionChannel,
}));

jest.mock("../env.js", () => ({
  env: mockEnv,
}));

describe("sessionChannel", () => {
  const originalWindow = global.window;
  const originalSessionStorage = global.sessionStorage;
  const originalCrypto = global.crypto;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.BASE_URL = "/staticGames/demo/";
    const store = new Map();
    global.sessionStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, v),
    };
    global.crypto = { randomUUID: jest.fn(() => "11111111-1111-4111-8111-111111111111") };
    global.window = {
      location: { search: "", origin: "https://example.com" },
    };
  });

  afterEach(() => {
    global.window = originalWindow;
    global.sessionStorage = originalSessionStorage;
    global.crypto = originalCrypto;
  });

  it("creates and configures a desktop pairing session", () => {
    const mod = require("./sessionChannel");
    const id = mod.initDesktopPairingSession();
    expect(id).toBe("11111111-1111-4111-8111-111111111111");
    expect(mockConfigureSessionChannel).toHaveBeenCalledWith(id);
  });

  it("applies controller session from URL or clears it", () => {
    const mod = require("./sessionChannel");
    global.window.location.search = "?session=11111111-1111-4111-8111-111111111111";
    expect(mod.applyControllerSessionFromUrl()).toBe("11111111-1111-4111-8111-111111111111");
    expect(mockConfigureSessionChannel).toHaveBeenCalled();

    global.window.location.search = "?session=bad";
    expect(mod.applyControllerSessionFromUrl()).toBeNull();
    expect(mockClearSessionChannel).toHaveBeenCalled();
  });

  it("builds the controller URL using BASE_URL (portal static host path)", () => {
    const mod = require("./sessionChannel");
    global.window.location.href = "https://example.com/games/human-motion";
    const url = mod.buildControllerPairUrl("11111111-1111-4111-8111-111111111111");
    expect(url).toBe(
      "https://example.com/staticGames/demo/controller.html?session=11111111-1111-4111-8111-111111111111#session=11111111-1111-4111-8111-111111111111"
    );
  });

  it("falls back to origin root when BASE_URL is /", () => {
    const mod = require("./sessionChannel");
    global.window.location.href = "https://example.com/staticGames/demo/levels/level-direction.html";
    mockEnv.BASE_URL = "/";
    const url = mod.buildControllerPairUrl("11111111-1111-4111-8111-111111111111");
    expect(url).toBe(
      "https://example.com/controller.html?session=11111111-1111-4111-8111-111111111111#session=11111111-1111-4111-8111-111111111111"
    );
  });

  it("reads controller session id from hash fallback", () => {
    const mod = require("./sessionChannel");
    global.window.location.search = "";
    global.window.location.hash = "#session=11111111-1111-4111-8111-111111111111";
    expect(mod.getControllerSessionFromUrl()).toBe("11111111-1111-4111-8111-111111111111");
  });
});
