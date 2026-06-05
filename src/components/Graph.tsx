"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type NodeTypes,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraph } from "@/hooks/useGraph";
import type { TopicNode, TopicEdge } from "@/types/graph";
import { CATEGORY_COLORS, OBSCURITY_STYLES } from "@/types/graph";
import Sidebar from "@/components/Sidebar";
import { useReactFlow } from "@xyflow/react";

//Custom node
function TopicNodeComponent({ data, id }: NodeProps) {
  const nodeData = data as TopicNode["data"];
  const colors =
    CATEGORY_COLORS[nodeData.category] ?? CATEGORY_COLORS["concept"];
  const obscure = OBSCURITY_STYLES[nodeData.obscurity] ?? OBSCURITY_STYLES[1];
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), nodeData.depth * 200);
    return () => clearTimeout(timer);
  }, []);

  const previewText = nodeData.description?.split(".")[0] + ".";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        obscure.nodeClass,
        "relative flex flex-col gap-1 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200",
        nodeData.expanded
          ? "opacity-60"
          : "hover:scale-105 hover:brightness-125",
        nodeData.expanding ? "animate-pulse" : "",
        nodeData.isRoot ? "ring-2 ring-violet-500/50" : "",
        hovered && !nodeData.expanded ? "brightness-125" : "",
      ].join(" ")}
      style={{
        background: colors.background,
        borderColor: hovered ? colors.border : `${colors.border}99`,
        boxShadow: hovered
          ? `0 0 20px ${colors.border}66`
          : obscure.glowIntensity !== "none"
            ? obscure.glowIntensity
            : undefined,
        minWidth: 160,
        maxWidth: 200,

        //Entrance animation
        opacity: mounted ? 1 : 0,
        transform: mounted
          ? "scale(1) translateY(0px)"
          : "scale(0.8) translateY(8px)",
        transition: [
          `opacity 0.4s ease-out ${nodeData.depth * 200}ms`,
          `transform 0.4s ease-out ${nodeData.depth * 200}ms`,
          "box-shadow 0.2s ease",
          "border-color 0.2s ease",
        ].join(","),
      }}
    >
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        style={{ opacity: 0 }}
      />

      {/* Image thumbnail */}
      {nodeData.imageUrl && (
        <div className="w-full h-16 rounded-lg overflow-hidden mb-1">
          <img
            src={nodeData.imageUrl}
            alt={nodeData.label}
            className="w-full h-full object-cover opacity-80"
          />
        </div>
      )}

      {/* Category badge */}
      <span
        className="text-[10px] font-semibold uppercase tracking-widest opacity-70"
        style={{ color: colors.text }}
      >
        {nodeData.category}
      </span>

      {/* Label */}
      <span
        className="text-sm font-semibold leading-tight"
        style={{ color: colors.text }}
      >
        {nodeData.label}
      </span>

      {/* Obscurity 3 indicator */}
      {nodeData.obscurity === 3 && (
        <span className="absolute top-2 right-2 text-[10px] text-violet-400 opacity-80">
          ✦
        </span>
      )}

      {/* Expanding spinner */}
      {nodeData.expanding && (
        <span className="absolute bottom-2 right-2 text-[10px] text-violet-300 animate-spin">
          ◌
        </span>
      )}

      {/* Expanded indicator */}
      {nodeData.expanded && !nodeData.expanding && (
        <span className="absolute bottom-2 right-2 text-[10px] text-zinc-500">
          ✓
        </span>
      )}

      {/* Hover preview */}
      {hovered && !nodeData.expanded && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 px-3 py-2 rounded-lg text-[11px] text-zinc-300 leading-relaxed pointer-events-none"
          style={{
            background: "rgba(10,10,15,0.95)",
            border: `1px solid ${colors.border}44`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
          }}
        >
          {previewText}
          <div className="mt-1 text-[10px] text-zinc-600">
            {nodeData.expanded ? "Already explored" : "Click to explore →"}
          </div>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="target"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  topicNode: TopicNodeComponent,
};

export default function Graph() {
  const { nodes: storeNodes, edges: storeEdges, status } = useGraph();
  const [nodes, setNodes, onNodesChange] = useNodesState<TopicNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TopicEdge>([]);
  const [selectedNode, setSelectedNode] = useState<TopicNode | null>(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    setNodes(storeNodes);
    setEdges(storeEdges);
  }, [storeNodes, storeEdges, setNodes, setEdges]);

  useEffect(() => {
    if (selectedNode) {
      const updated = storeNodes.find((n) => n.id === selectedNode.id);
      if (updated) setSelectedNode(updated);
      //If node finished expanding, refit view to adjust for new nodes
      if (updated?.data.expanded && !updated?.data.expanding) {
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 600 });
        }, 100);
      }
    }
  }, [storeNodes]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: TopicNode) => {
      setSelectedNode(node);
    },
    [],
  );

  if (status === "idle") return null;

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#ffffff08"
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const n = node as TopicNode;
            return CATEGORY_COLORS[n.data?.category]?.border ?? "#555";
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>

      <Sidebar node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}
