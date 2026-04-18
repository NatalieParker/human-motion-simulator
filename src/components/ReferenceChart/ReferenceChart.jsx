import { useEffect, useRef } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import { MOTION_LABELS } from "../../lib/motionPatterns/motionPatterns";
import "./ReferenceChart.css";

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

export function ReferenceChart({ pattern, motion }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    chartRef.current?.destroy();

    const ctx = canvasRef.current.getContext("2d");
    const a = pattern.acceleration;
    const allVals = [...a.x, ...a.y, ...a.z];
    const dataMax = Math.max(...allVals);
    const dataMin = Math.min(...allVals);

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: pattern.labels.map((t) => t.toFixed(1)),
        datasets: [
          makeDataset("Accel X", a.x, "#f87171"),
          makeDataset("Accel Y", a.y, "#38bdf8"),
          makeDataset("Accel Z", a.z, "#4ade80"),
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
            min: dataMin - 5,
            max: dataMax + 5,
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
  }, [pattern, motion]);

  return (
    <div class="reference-chart">
      <h2>Target Pattern: {MOTION_LABELS[motion]}</h2>
      <div class="reference-chart__canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
