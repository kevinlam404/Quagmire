"use client";

import {useCallback, useEffect} from "react";
import {ReactFlow, Background, Controls, MiniMap, BackgroundVariant, useNodesState, useEdgesState, Handle, Position, type NodeTypes, type NodeProps} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {useGraph} from "@/hooks/useGraph";
import type {TopicNode, TopicEdge} from "@/types/graph";
import {CATEGORY_COLORS, OBSCURITY_STYLES} from "@/types/graph";

//Custom node
function TopicNodeComponent({data,id}: NodeProps){
    const {expandNode, status} = useGraph();
    const nodeData = data as TopicNode["data"];
    const colors = CATEGORY_COLORS[nodeData.category] ?? CATEGORY_COLORS["concept"];
    const obscure = OBSCURITY_STYLES[nodeData.obscurity] ?? OBSCURITY_STYLES[1];

    const handleClick = useCallback(() => {
        if(nodeData.expanded || nodeData.expanding) return;
        expandNode(id);
    }, [id, nodeData.expanded, nodeData.expanding, expandNode]);

    return (
    <div
      onClick={handleClick}
      className={[
        obscure.nodeClass,
        "relative flex flex-col gap-1 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200",
        nodeData.expanded   ? "opacity-60" : "hover:scale-105 hover:brightness-125",
        nodeData.expanding  ? "animate-pulse" : "",
        nodeData.isRoot     ? "ring-2 ring-violet-500/50" : "",
      ].join(" ")}
      style={{
        background:  colors.background,
        borderColor: colors.border,
        boxShadow:   obscure.glowIntensity !== "none" ? obscure.glowIntensity : undefined,
        minWidth:    160,
        maxWidth:    200,
      }}
    >

      <Handle type="source" position={Position.Left} id="source" style={{ opacity: 0 }} />

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
      <Handle type="target" position={Position.Left} id="target" style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
    topicNode: TopicNodeComponent,
};

export default function Graph(){
    const {nodes: storeNodes, edges: storeEdges, status} = useGraph();
    const [nodes, setNodes, onNodesChange] = useNodesState<TopicNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<TopicEdge>([]);

    useEffect(() => {
        setNodes(storeNodes);
        setEdges(storeEdges);
    }, [storeNodes, storeEdges, setNodes, setEdges]);

    if(status === "idle") return null;

    return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
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
        <Controls/>
        <MiniMap
          nodeColor={(node) => {
            const n = node as TopicNode;
            return CATEGORY_COLORS[n.data?.category]?.border ?? "#555";
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}
