import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export function captureSnapshot(dataWindow) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 180;

  const startT = dataWindow[0].t;
  const labels = dataWindow.map((d) => ((d.t - startT) / 1000).toFixed(1));
  const ax = dataWindow.map((d) => d.x);
  const ay = dataWindow.map((d) => d.y);
  const az = dataWindow.map((d) => d.z);

  const allVals = [...ax, ...ay, ...az];
  const dataMin = Math.min(...allVals);
  const dataMax = Math.max(...allVals);

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "X", data: ax, borderColor: "#f87171", backgroundColor: "#f87171", borderWidth: 1.5, pointRadius: 0, tension: 0.25 },
        { label: "Y", data: ay, borderColor: "#38bdf8", backgroundColor: "#38bdf8", borderWidth: 1.5, pointRadius: 0, tension: 0.25 },
        { label: "Z", data: az, borderColor: "#4ade80", backgroundColor: "#4ade80", borderWidth: 1.5, pointRadius: 0, tension: 0.25 },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      scales: {
        x: {
          title: { display: true, text: "Time (s)", color: "#94a3b8", font: { size: 10 } },
          ticks: { color: "#64748b", maxTicksLimit: 6, font: { size: 9 } },
          grid: { color: "#1e293b" },
        },
        y: {
          title: { display: true, text: "m/s\u00B2", color: "#94a3b8", font: { size: 10 } },
          ticks: { color: "#64748b", font: { size: 9 } },
          grid: { color: "#1e293b" },
          min: dataMin - 5,
          max: dataMax + 5,
        },
      },
      plugins: {
        legend: {
          labels: { color: "#e2e8f0", usePointStyle: true, pointStyle: "line", font: { size: 10 } },
        },
      },
    },
  });

  const image = canvas.toDataURL("image/png");
  chart.destroy();

  return image;
}
