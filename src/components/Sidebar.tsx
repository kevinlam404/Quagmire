"use client";

import { useState } from "react";
import { useGraph } from "@/hooks/useGraph";
import { CATEGORY_COLORS } from "@/types/graph";
import type { TopicNode } from "@/types/graph";
import { useIsMobile } from "@/hooks/useIsMobile";

interface SidebarProps {
  node: TopicNode | null;
  onClose: () => void;
  onExpandChange: (expanded: boolean) => void;
}

export default function Sidebar({
  node,
  onClose,
  onExpandChange,
}: SidebarProps) {
  const { expandNode, status, generateGraph } = useGraph();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  if (!node) return null;

  const nodeData = node.data;
  const colors =
    CATEGORY_COLORS[nodeData.category] ?? CATEGORY_COLORS["concept"];
  const isExpanding = nodeData.expanding;
  const isExpanded = nodeData.expanded;
  const isLoading = status === "expanding";

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    onExpandChange(next);
  };

  const handleClose = () => {
    setExpanded(false);
    onExpandChange(false);
    onClose();
  };

  const handleExpand = () => {
    if (isExpanded || isExpanding || isLoading) return;
    expandNode(node.id);
  };

  const containerClass = isMobile
    ? expanded
      ? "fixed inset-0 flex flex-col bg-zinc-950"
      : "fixed bottom-0 left-0 right-0 flex flex-col bg-zinc-950 border-t border-white/10 rounded-t-2xl max-h-[75vh]"
    : expanded
      ? "fixed inset-0 flex flex-col bg-zinc-950/98 backdrop-blur-md"
      : "absolute top-0 right-0 h-full w-96 flex flex-col bg-zinc-950/90 border-l border-white/10 backdrop-blur-md";

  return (
    <>
      {/* Backdrop */}
      {isMobile && !expanded && (
        <div
          className="fixed inset-0 bg-black/50"
          style={{ zIndex: 28 }}
          onClick={handleClose}
        />
      )}

      <div className={containerClass} style={{ zIndex: expanded ? 100 : 29 }}>
        {/* Mobile drag handle */}
        {isMobile && !expanded && (
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <span
            className="text-[11px] font-semibold uppercase tracking-widest px-2 py-1 rounded-md"
            style={{
              background: colors.background,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            {nodeData.category}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleExpanded}
              className="cursor-pointer text-zinc-500 hover:text-white transition-colors text-sm leading-none px-2 py-1 rounded-lg border border-white/10 hover:border-white/20 bg-white/5"
              title={expanded ? "Collapse" : "Expand to full screen"}
            >
              {expanded ? "⊟" : "⊞"}
            </button>
            <button
              onClick={handleClose}
              className="cursor-pointer text-zinc-500 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 px-5 py-5 flex-1 overflow-y-auto">
          {nodeData.imageUrl && (
            <div
              className={`w-full rounded-xl overflow-hidden shrink-0 ${expanded ? "h-56" : "h-36"}`}
            >
              <img
                src={nodeData.imageUrl}
                alt={nodeData.label}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <h2
              className={`font-bold leading-tight ${expanded ? "text-2xl" : "text-xl"}`}
              style={{ color: colors.text }}
            >
              {nodeData.label}
            </h2>
            {nodeData.obscurity === 3 && (
              <div className="flex items-center gap-1 text-violet-400 text-xs shrink-0 mt-1">
                <span>✦</span>
                <span>Surprising</span>
              </div>
            )}
          </div>

          <p
            className={`text-zinc-400 leading-relaxed ${expanded ? "text-base" : "text-sm"}`}
          >
            {nodeData.description}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
              Depth
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(nodeData.depth + 1, 5) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: colors.border }}
                  />
                ),
              )}
            </div>
            <span className="text-[11px] text-zinc-600">
              {nodeData.depth} hops from root
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
              Obscurity
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      level <= nodeData.obscurity
                        ? colors.border
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] text-zinc-600">
              {nodeData.obscurity === 1
                ? "Obvious"
                : nodeData.obscurity === 2
                  ? "Interesting"
                  : "Surprising"}
            </span>
          </div>

          {nodeData.seeds?.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
                Rabbit holes
              </span>
              <div className="flex flex-wrap gap-2">
                {nodeData.seeds.map((seed: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleClose();
                      generateGraph(seed);
                    }}
                    className="cursor-pointer text-[11px] px-3 py-1.5 rounded-full border border-white/10 text-zinc-400 bg-white/5 hover:border-violet-500/60 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200"
                  >
                    → {seed}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-zinc-600">
            <span className="uppercase tracking-widest font-semibold">
              Status
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                background: isExpanded
                  ? "rgba(255,255,255,0.05)"
                  : colors.background,
                color: isExpanded ? "#71717a" : colors.text,
                border: `1px solid ${isExpanded ? "rgba(255,255,255,0.08)" : colors.border}`,
              }}
            >
              {isExpanded ? "Explored" : "Unexplored"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          {isExpanded ? (
            <p className="text-xs text-zinc-600 text-center">
              ✓ Already explored
            </p>
          ) : (
            <button
              onClick={handleExpand}
              disabled={isLoading || isExpanding}
              className="cursor-pointer w-full py-3 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isExpanding ? "Following the thread..." : "Expand →"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
