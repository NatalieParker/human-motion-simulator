import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const setData = jest.fn();
const setIsLoading = jest.fn();
const setError = jest.fn();
const cleanupMock = jest.fn();
const saveGameData = jest.fn();

jest.mock("preact/hooks", () => ({
  useState: jest
    .fn()
    .mockImplementationOnce(() => [{}, setData])
    .mockImplementationOnce(() => [true, setIsLoading])
    .mockImplementationOnce(() => [null, setError]),
  useEffect: jest.fn((fn: () => () => void) => {
    fn();
  }),
  useCallback: jest.fn((fn: unknown) => fn),
  useMemo: jest.fn((fn: () => unknown) => fn()),
}));

jest.mock("../portalBridge/portalBridge", () => ({
  initPortalBridge: jest.fn(() => cleanupMock),
  fetchGameData: jest.fn(() => Promise.resolve({ loaded: true })),
  saveGameData,
}));

describe("usePortalGameData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns API with persist and mergeAndPersist", () => {
    const { usePortalGameData } = require("./usePortalGameData");
    const api = usePortalGameData();

    expect(api).toEqual(
      expect.objectContaining({
        data: {},
        isLoading: true,
        error: null,
        persist: expect.any(Function),
        mergeAndPersist: expect.any(Function),
      })
    );

    api.persist({ score: 10 });
    expect(setData).toHaveBeenCalledWith({ score: 10 });
    expect(saveGameData).toHaveBeenCalledWith({ score: 10 });

    api.mergeAndPersist({ stars: 3 });
    const updaterCall = setData.mock.calls.find((call) => typeof call[0] === "function");
    expect(updaterCall).toBeDefined();
    const updater = updaterCall?.[0] as (prev: Record<string, unknown>) => Record<string, unknown>;
    const next = updater({ score: 10, level: 1 });
    expect(next).toEqual({ score: 10, level: 1, stars: 3 });
    expect(saveGameData).toHaveBeenCalledWith({ score: 10, level: 1, stars: 3 });
  });
});
