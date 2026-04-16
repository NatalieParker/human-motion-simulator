import { useEffect, useRef } from "preact/hooks";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

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

export function ReferenceChart({ sampleData }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !Array.isArray(sampleData) || sampleData.length === 0) return;

    const labels = sampleData.map((row) => ((row.t || 0) / 1000).toFixed(1));
    const ax = sampleData.map((row) => row.x ?? 0);
    const ay = sampleData.map((row) => row.y ?? 0);
    const az = sampleData.map((row) => row.z ?? 0);

    const allVals = [...ax, ...ay, ...az];
    const min = Math.min(...allVals) - 0.5;
    const max = Math.max(...allVals) + 0.5;

    const ctx = canvasRef.current.getContext("2d");
    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          makeDataset("Accel X", ax, "#f87171"),
          makeDataset("Accel Y", ay, "#38bdf8"),
          makeDataset("Accel Z", az, "#4ade80"),
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
            title: { display: true, text: "Acceleration (m/s²)", color: "#94a3b8" },
            ticks: { color: "#64748b" },
            grid: { color: "#1e293b" },
            min,
            max,
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
  }, [sampleData]);

  return (
    <div class="learn-reference-chart">
      <div class="learn-reference-chart__canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
