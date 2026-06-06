"use client";

import { useEffect, useRef } from "react";
import SearchBar from "@/components/SearchBar";
import Graph from "@/components/Graph";
import { useGraph } from "@/hooks/useGraph";
import { ReactFlowProvider } from "@xyflow/react";
import Header from "@/components/Header";

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    let animId: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(124,58,237,0.5)";
        ctx.fill();
      });

      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(124,58,237,${0.12 * (1 - d / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}

export default function Home() {
  const { status } = useGraph();
  const showGraph = status !== "idle";

  return (
    <main className="relative flex flex-col items-center justify-center w-full h-screen bg-black overflow-hidden">
      {/* Particle background */ <ParticleBackground />}
      {/* Search bar */}
      <div
        className={[
          "absolute z-10 transition-all duration-500",
          showGraph
            ? "top-20 left-1/2 -translate-x-1/2 w-full max-w-xl"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl",
        ].join(" ")}
      >
        <SearchBar />
      </div>

      {/* Graph canvas */}
      {showGraph && (
        <ReactFlowProvider>
          <div className="absolute inset-0 z-0">
            <Header />
            <Graph />
          </div>
        </ReactFlowProvider>
      )}
    </main>
  );
}
