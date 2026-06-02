"use client";

import Image from "next/image";
import {useGraph} from "@/hooks/useGraph";
import {CATEGORY_COLORS} from "@/types/graph";

export default function Header(){
    const {resetGraph, nodes, history, historyIndex, travelTo, status} = useGraph();

    if(status === "idle") return null;

    const expandedCount = nodes.filter((n) => n.data.expanded).length;

    return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3 bg-zinc-950/80 border-b border-white/10 backdrop-blur-md">

      {/* Left — logo */}
      <button onClick={resetGraph} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
        <Image
          src="/quagmire-symbol.png"
          alt="Quagmire"
          width={28}
          height={28}
          className="invert opacity-80"
        />
        <span className="text-white font-bold tracking-tight text-sm uppercase">Quagmire</span>
      </button>

      {/* Center — breadcrumb trail */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-xl scrollbar-none">
        {history.map((entry, index) => {
          const isCurrent = index === historyIndex;
          const isFuture = index > historyIndex;
          const node = nodes.find((n) => n.data.label === entry.trigger);
          const colors = node
            ? CATEGORY_COLORS[node.data.category]
            : null;

          return (
            <div key={index} className="flex items-center gap-1 shrink-0">
              {index > 0 && (
                <span className="text-zinc-700 text-xs">→</span>
              )}
              <button
                onClick={() => travelTo(index)}
                className={[
                  "px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-200",
                  isCurrent ? "text-white" : "",
                  isFuture ? "opacity-30" : "hover:opacity-80",
                ].join(" ")}
                style={colors && isCurrent ? {
                  background: colors.background,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                } : {
                  background: "rgba(255,255,255,0.05)",
                  color: "#71717a",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {entry.trigger}
              </button>
            </div>
          );
        })}
      </div>

      {/* Right — stats + actions */}
      <div className="flex items-center gap-3">
        <span className="text-zinc-600 text-xs">
          <span className="text-violet-400 font-semibold">{expandedCount}</span> threads explored
        </span>
        <button
          onClick={resetGraph}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-200"
        >
          New Search
        </button>
      </div>
    </div>
  );
}