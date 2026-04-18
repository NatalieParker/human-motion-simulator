const mockConfigureSessionChannel = jest.fn();
const mockClearSessionChannel = jest.fn();

jest.mock("../supabase/supabase", () => ({
  configureSessionChannel: mockConfigureSessionChannel,
  clearSessionChannel: mockClearSessionChannel,
}));

describe("sessionChannel", () => {
  const originalWindow = global.window;
  const originalSessionStorage = global.sessionStorage;
  const originalCrypto = global.crypto;

  beforeEach(() => {
    jest.clearAllMocks();
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

  it("builds the controller URL next to the current page", () => {
    const mod = require("./sessionChannel");
    global.window.location.href = "https://example.com/staticGames/demo/train.html?foo=bar";
    const url = mod.buildControllerPairUrl("11111111-1111-4111-8111-111111111111");
    expect(url).toBe(
      "https://example.com/staticGames/demo/controller.html?session=11111111-1111-4111-8111-111111111111"
    );
  });
});
