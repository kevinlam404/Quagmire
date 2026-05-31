import type { RawExpandResponse, TopicNode, TopicEdge } from "@/types/graph";
import {transformNodes, transformEdges, transformCrossEdges, deduplicateNodes, deduplicateEdges} from "@/lib/graph/transform";
import { applyDagreLayout } from "@/lib/graph/buildGraph";

//Expand node
export function expandNode(existingNodes: TopicNode[], existingEdges: TopicEdge[], raw: RawExpandResponse, expandedNodeId: string): {
    nodes: TopicNode[];
    edges: TopicEdge[];
} {
    if(!raw.nodes?.length){
        console.warn("expandNode: no new nodes in response");
        return {nodes: existingNodes, edges: existingEdges};
    }

    //Build depth map for new nodes
    const expandedNode = existingNodes.find((n) => n.id === expandedNodeId);
    const expandedDepth = expandedNode?.data.depth ?? 0;

    const depthMap: Record<string, number> ={};
    raw.nodes.forEach((n)=> {
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

    const newCrossEdges = transformCrossEdges(raw.crossEdges ?? [], [...existingNodeRefs,...newNodes.map((n) => ({
        id: n.id,
        label: n.data.label,
    }))]);

    //Deduplicate
    const uniqueNewNodes = deduplicateNodes(existingNodes, newNodes);
    const uniqueNewEdges = deduplicateEdges(existingEdges, [...newEdges, ...newCrossEdges]);

   //Mark expanded node as expanded
    const updatedExistingNodes = existingNodes.map((n) => n.id === expandedNodeId ? {...n, data: {...n.data, expanded: true, expanding: false}}: n);
    
    //Apply dagre layout to NEW nodes only — keep existing nodes in place
    const mergedEdges = [...existingEdges, ...uniqueNewEdges];
    const mergedNodes = [...updatedExistingNodes, ...uniqueNewNodes];

    const newNodesOnly = applyDagreLayout(mergedNodes, mergedEdges, expandedNodeId);

    const existingIds = new Set(updatedExistingNodes.map((n) => n.id));
    const positionedNodes = newNodesOnly.map((n) => {
        if(existingIds.has(n.id)){
            const original = updatedExistingNodes.find((e) => e.id === n.id);
            return original ?? n;
        }
        return n;
    });

    return {
        nodes: positionedNodes,
        edges: mergedEdges,
    };
}
