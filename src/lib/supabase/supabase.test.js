const mockCreateClient = jest.fn();
const mockEnv = {};

jest.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

jest.mock("../env.js", () => ({
  env: mockEnv,
}));

function flushAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("supabase unit", () => {
  let upsertMock;
  let selectMock;
  let eqMock;
  let maybeSingleMock;
  let onMock;
  let subscribeMock;
  let removeChannelMock;
  let realtimeCallback;
  let channelSubscription;

  function loadModule() {
    jest.resetModules();
    return require("./supabase");
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.VITE_SUPABASE_URL = "https://example.supabase.co";
    mockEnv.VITE_SUPABASE_ANON_KEY = "anon-key";
    mockEnv.VITE_SUPABASE_SESSION_TABLE = "session_state";
    mockEnv.VITE_SUPABASE_SESSION_ID = "";

    upsertMock = jest.fn().mockResolvedValue({ error: null });
    maybeSingleMock = jest.fn().mockResolvedValue({
      data: { signal: "start", sensor_data: { x: 1, y: 2, z: 3 } },
      error: null,
    });
    eqMock = jest.fn(() => ({ maybeSingle: maybeSingleMock }));
    selectMock = jest.fn(() => ({ eq: eqMock }));
    channelSubscription = { id: "chan" };
    subscribeMock = jest.fn(() => channelSubscription);
    onMock = jest.fn((event, filter, cb) => {
      realtimeCallback = cb;
      return { on: onMock, subscribe: subscribeMock };
    });
    removeChannelMock = jest.fn().mockResolvedValue({});

    mockCreateClient.mockReturnValue({
      from: jest.fn(() => ({ upsert: upsertMock, select: selectMock })),
      channel: jest.fn(() => ({ on: onMock, subscribe: subscribeMock })),
      removeChannel: removeChannelMock,
    });
  });

  it("writes and subscribes to sensor path", async () => {
    const mod = loadModule();
    mod.configureSessionChannel("session-1");
    await mod.set(mod.signalRef, "start");
    await mod.set(mod.signalRef, "stop");
    expect(upsertMock).toHaveBeenCalled();
    expect(upsertMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "session-1",
        signal: "stop",
      }),
      expect.objectContaining({ onConflict: "id" })
    );

    const values = [];
    const unsub = mod.onValue(mod.sensorDataRef, (s) => values.push(s.val()));
    await flushAsync();
    expect(values[0]).toEqual({ x: 1, y: 2, z: 3 });
    realtimeCallback({ new: { sensor_data: { x: 9, y: 8, z: 7 } } });
    expect(values.at(-1)).toEqual({ x: 9, y: 8, z: 7 });
    unsub();
    expect(removeChannelMock).toHaveBeenCalledWith(channelSubscription);
  });
});
