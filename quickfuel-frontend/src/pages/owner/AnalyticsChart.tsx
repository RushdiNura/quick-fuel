import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export function AnalyticsChart({ reservations }: { reservations: { created_at: string; total_price: number; status: string }[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
    const labels = days.map(d => d.toLocaleDateString(undefined, { weekday: "short" }));
    const counts = days.map(d => reservations.filter(r => new Date(r.created_at).toDateString() === d.toDateString()).length);
    const revenue = days.map(d => reservations
      .filter(r => new Date(r.created_at).toDateString() === d.toDateString() && r.status !== "cancelled")
      .reduce((s, r) => s + Number(r.total_price), 0));

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Reservations", data: counts, backgroundColor: "#15544A", yAxisID: "y" },
          { label: "Revenue (ETB)", data: revenue, type: "line", borderColor: "#F2AA63", backgroundColor: "#F2AA63", yAxisID: "y1" },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, position: "left" },
          y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false } },
        },
        plugins: { legend: { labels: { boxWidth: 10, font: { size: 10 } } } },
      },
    });
    return () => chartRef.current?.destroy();
  }, [reservations]);

  return <canvas ref={canvasRef} height={160} />;
}
