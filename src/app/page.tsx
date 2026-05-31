"use client";

import SearchBar from "@/components/SearchBar";
import Graph from "@/components/Graph";
import { useGraph } from "@/hooks/useGraph";
import {ReactFlowProvider} from "reactflow";

export default function Home() {
  const { status } = useGraph();
  const showGraph = status !== "idle";

  return (
    <main className="relative flex flex-col items-center justify-center w-full h-screen bg-black overflow-hidden">
      {/* Search bar */}
      <div
        className={[
          "absolute z-10 transition-all duration-500",
          showGraph
            ? "top-6 left-1/2 -translate-x-1/2 w-full max-w-xl"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl",
        ].join(" ")}
      >
        <SearchBar />
      </div>

      {/* Graph canvas */}
      {showGraph && (
        <ReactFlowProvider>
        <div className="absolute inset-0 z-0">
          <Graph />
        </div>
        </ReactFlowProvider>
      )}
    </main>
  );
}
