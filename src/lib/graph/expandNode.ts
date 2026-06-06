import type { RawExpandResponse, TopicNode, TopicEdge } from "@/types/graph";
import {
  transformNodes,
  transformEdges,
  transformCrossEdges,
  deduplicateNodes,
  deduplicateEdges,
} from "@/lib/graph/transform";
import { applyDagreLayout } from "@/lib/graph/buildGraph";
import { MarkerType } from "@xyflow/react";

//Expand node
export function expandNode(
  existingNodes: TopicNode[],
  existingEdges: TopicEdge[],
  raw: RawExpandResponse,
  expandedNodeId: string,
): {
  nodes: TopicNode[];
  edges: TopicEdge[];
} {
  if (!raw.nodes?.length) {
    console.warn("expandNode: no new nodes in response");
    return { nodes: existingNodes, edges: existingEdges };
  }

  //Build depth map for new nodes
  const expandedNode = existingNodes.find((n) => n.id === expandedNodeId);
  const expandedDepth = expandedNode?.data.depth ?? 0;

  const depthMap: Record<string, number> = {};
  raw.nodes.forEach((n) => {
    depthMap[n.id] = expandedDepth + 1;
  });

  //Transform new nodes and edges
  const newNodes = transformNodes(raw.nodes, depthMap);
  const newEdges = transformEdges(raw.edges, [...existingNodes, ...newNodes]);

  //Resolve cross edges (connects new nodes back to existing canvas nodes)
  const existingNodeRefs = existingNodes.map((n) => ({
    id: n.id,
    label: n.data.label,
  }));

  const newCrossEdges = transformCrossEdges(raw.crossEdges ?? [], [
    ...existingNodeRefs,
    ...newNodes.map((n) => ({
      id: n.id,
      label: n.data.label,
    })),
  ]);

  //Deduplicate
  const uniqueNewNodes = deduplicateNodes(existingNodes, newNodes);
  const uniqueNewEdges = deduplicateEdges(existingEdges, [
    ...newEdges,
    ...newCrossEdges,
  ]);

  //Mark expanded node as expanded
  const updatedExistingNodes = existingNodes.map((n) =>
    n.id === expandedNodeId
      ? { ...n, data: { ...n.data, expanded: true, expanding: false } }
      : n,
  );

  const expandedPosition = expandedNode?.position ?? { x: 0, y: 0 };
  const NODE_HEIGHT      = 120;
  const NODE_WIDTH       = 220;
  const HORIZONTAL_GAP   = 320;
  const VERTICAL_GAP     = 60;
  const totalHeight      = uniqueNewNodes.length * (NODE_HEIGHT + VERTICAL_GAP);
  const startY           = expandedPosition.y - totalHeight / 2;

  //Find the rightmost x position among existing nodes at the same depth to avoid overlap
  const sameDepthNodes = existingNodes.filter(
    (n) => n.data.depth === expandedDepth + 1
  );
  const rightmostX = sameDepthNodes.length > 0
    ? Math.max(...sameDepthNodes.map((n) => n.position.x)) + NODE_WIDTH + 40
    : expandedPosition.x + HORIZONTAL_GAP;

  const targetX = Math.max(
    expandedPosition.x + HORIZONTAL_GAP,
    rightmostX
  );

  const positionedNewNodes = uniqueNewNodes.map((node, i) => ({
    ...node,
    position: {
      x: targetX,
      y: startY + i * (NODE_HEIGHT + VERTICAL_GAP),
    },
  }));

  const guaranteedEdges: TopicEdge[] = uniqueNewNodes.map((node) => ({
    id: `guaranteed_${expandedNodeId}_${node.id}`,
    source: expandedNodeId,
    target: node.id,
    sourceHandle: "source",
    targetHandle: "target",
    animated: true,
    data: {
      label: "expands to",
      relationshipType: null,
      obscurity: 1 as const,
      isCrossEdge: false,
    },
    style: {
      stroke: "#555",
      strokeWidth: 1,
      opacity: 0.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#555",
    },
  }));

  //Merge everything together
  const mergedEdges = [...existingEdges, ...uniqueNewEdges, ...guaranteedEdges];
  const mergedNodes = [...updatedExistingNodes, ...positionedNewNodes];

  return {
    nodes: mergedNodes,
    edges: mergedEdges,
  };
}
