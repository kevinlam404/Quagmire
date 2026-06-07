"use client";

import { useGraph } from "@/hooks/useGraph";
import { CATEGORY_COLORS } from "@/types/graph";
import type { TopicNode } from "@/types/graph";
import { useIsMobile } from "@/hooks/useIsMobile";

interface SidebarProps {
  node: TopicNode | null;
  onClose: () => void;
}

export default function Sidebar({ node, onClose }: SidebarProps) {
  const { expandNode, status, generateGraph } = useGraph();
  const isMobile = useIsMobile();

  if (!node) return null;

  const nodeData = node.data;
  const colors =
    CATEGORY_COLORS[nodeData.category] ?? CATEGORY_COLORS["concept"];
  const isExpanding = nodeData.expanding;
  const isExpanded = nodeData.expanded;
  const isLoading = status === "expanding";

  const handleExpand = () => {
    if (isExpanded || isExpanding || isLoading) return;
    expandNode(node.id);
  };

  const containerClass = isMobile
    ? "fixed bottom-0 left-0 right-0 flex flex-col bg-zinc-950 border-t border-white/10 rounded-t-2xl max-h-[70vh]"
    : "absolute top-0 right-0 h-full w-80 flex flex-col bg-zinc-950/90 border-l border-white/10 backdrop-blur-md";

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50"
          style={{ zIndex: 28 }}
          onClick={onClose}
        />
      )}

      <div className={containerClass} style={{ zIndex: 29 }}>
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
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
          <button
            onClick={onClose}
            className="cursor-pointer text-zinc-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 px-4 py-4 flex-1 overflow-y-auto">
          {nodeData.imageUrl && (
            <div className="w-full h-32 rounded-xl overflow-hidden shrink-0">
              <img
                src={nodeData.imageUrl}
                alt={nodeData.label}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h2
            className="text-xl font-bold leading-tight"
            style={{ color: colors.text }}
          >
            {nodeData.label}
          </h2>

          <p className="text-sm text-zinc-400 leading-relaxed">
            {nodeData.description}
          </p>

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
                      onClose();
                      generateGraph(seed);
                    }}
                    className="cursor-pointer text-[11px] px-2 py-1 rounded-full border border-white/10 text-zinc-400 bg-white/5 hover:border-violet-500/60 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200"
                  >
                    → {seed}
                  </button>
                ))}
              </div>
            </div>
          )}

          {nodeData.obscurity === 3 && (
            <div className="flex items-center gap-2 text-violet-400 text-xs">
              <span>✦</span>
              <span>Surprising connection</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10 shrink-0">
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
