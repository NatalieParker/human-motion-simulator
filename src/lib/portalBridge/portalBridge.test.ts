import { describe, expect, it, jest, beforeEach } from "@jest/globals";

describe("portalBridge", () => {
  let messageHandler: ((event: MessageEvent) => void) | null = null;
  const postMessage = jest.fn();

  function loadBridge() {
    jest.resetModules();
    return require("./portalBridge");
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).window = {
      self: {},
      top: {},
      parent: { postMessage },
      addEventListener: jest.fn((name: string, cb: (e: MessageEvent) => void) => {
        if (name === "message") messageHandler = cb;
      }),
      removeEventListener: jest.fn(),
      setTimeout,
      clearTimeout,
    };
  });

  it("requests and resolves game data via message channel", async () => {
    const { fetchGameData, initPortalBridge } = loadBridge();
    initPortalBridge();
    const promise = fetchGameData(1000);

    expect(postMessage).toHaveBeenCalledWith(
      { type: "PORTAL_GAME_DATA_LOAD_REQUEST", payload: {} },
      "*"
    );

    messageHandler?.({
      origin: "https://portal.example",
      data: { type: "PORTAL_GAME_DATA_LOADED", payload: { score: 7 } },
    } as MessageEvent);

    await expect(promise).resolves.toEqual({ score: 7 });
  });

  it("emits save and custom event payloads", () => {
    const { emitGameEvent, saveGameData } = loadBridge();
    saveGameData({ level: 2 });
    emitGameEvent("LEVEL_UP", { points: 10 });

    expect(postMessage).toHaveBeenCalledWith(
      { type: "PORTAL_GAME_DATA_SAVE", payload: { level: 2 } },
      "*"
    );
    expect(postMessage).toHaveBeenCalledWith(
      { type: "PORTAL_GAME_EVENT", payload: { event: "LEVEL_UP", points: 10 } },
      "*"
    );
  });
});
