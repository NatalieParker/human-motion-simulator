const mockRegister = jest.fn();
const mockDestroy = jest.fn();
const mockChartCtor = jest.fn(() => ({ destroy: mockDestroy }));

jest.mock("chart.js", () => ({
  Chart: Object.assign(mockChartCtor, { register: mockRegister }),
  registerables: ["a", "b"],
}));

describe("chartSnapshot", () => {
  const originalDocument = global.document;

  beforeEach(() => {
    jest.clearAllMocks();
    global.document = {
      createElement: jest.fn(() => ({
        width: 0,
        height: 0,
        toDataURL: jest.fn(() => "data:image/png;base64,TEST"),
      })),
    };
  });

  afterEach(() => {
    global.document = originalDocument;
  });

  it("captures a snapshot image and destroys chart instance", () => {
    const { captureSnapshot } = require("./chartSnapshot");
    const image = captureSnapshot([
      { t: 1000, x: 1, y: 2, z: 3 },
      { t: 2000, x: 4, y: 5, z: 6 },
    ]);

    expect(image).toBe("data:image/png;base64,TEST");
    expect(mockRegister).toHaveBeenCalled();
    expect(mockChartCtor).toHaveBeenCalledTimes(1);

    const chartConfig = mockChartCtor.mock.calls[0][1];
    expect(chartConfig.data.labels).toEqual(["0.0", "1.0"]);
    expect(chartConfig.options.scales.y.min).toBe(-4);
    expect(chartConfig.options.scales.y.max).toBe(11);
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });
});
