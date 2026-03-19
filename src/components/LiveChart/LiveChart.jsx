import { useEffect, useRef } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import "./LiveChart.css";

Chart.register(...registerables);

const MAX_POINTS = 100;

function makeDataset(label, data, color) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.25,
  };
}

export function LiveChart({ sensorData, running, startTime }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({
    labels: [],
    ax: [], ay: [], az: [],
  });

  useEffect(() => {
    const s = seriesRef.current;
    const ctx = canvasRef.current.getContext("2d");

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: s.labels,
        datasets: [
          makeDataset("Accel X", s.ax, "#f87171"),
          makeDataset("Accel Y", s.ay, "#38bdf8"),
          makeDataset("Accel Z", s.az, "#4ade80"),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            title: { display: true, text: "Time (s)", color: "#94a3b8" },
            ticks: { color: "#64748b", maxTicksLimit: 10 },
            grid: { color: "#1e293b" },
          },
          y: {
            title: { display: true, text: "Acceleration (m/s\u00B2)", color: "#94a3b8" },
            ticks: { color: "#64748b" },
            grid: { color: "#1e293b" },
            min: -5,
            max: 5,
          },
        },
        plugins: {
          legend: {
            labels: { color: "#e2e8f0", usePointStyle: true, pointStyle: "line" },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (!sensorData || !running) return;

    const s = seriesRef.current;
    const a = sensorData.acceleration || {};
    const t = ((sensorData.timestamp || Date.now()) - startTime) / 1000;

    s.labels.push(t.toFixed(1));
    s.ax.push(a.x ?? 0);
    s.ay.push(a.y ?? 0);
    s.az.push(a.z ?? 0);

    if (s.labels.length > MAX_POINTS) {
      s.labels.shift();
      s.ax.shift(); s.ay.shift(); s.az.shift();
    }

    const allVals = [...s.ax, ...s.ay, ...s.az];
    const chart = chartRef.current;
    if (chart && allVals.length > 0) {
      chart.options.scales.y.min = Math.min(...allVals) - 5;
      chart.options.scales.y.max = Math.max(...allVals) + 5;
    }

    chart?.update();
  }, [sensorData, running, startTime]);

  return (
    <div class="live-chart">
      <h2>Live Sensor Data</h2>
      <div class="live-chart__canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
