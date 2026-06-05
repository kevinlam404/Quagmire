import { MarkerType } from "@xyflow/react";
import type { RawNode, RawEdge, RawCrossEdge, TopicNode, TopicEdge, TopicNodeData, TopicEdgeData } from "@/types/graph";
import { CATEGORY_COLORS, OBSCURITY_STYLES } from "@/types/graph";
import { resolveLabelToId, slugify } from "@/lib/ai/prompts";


//Constants 

const DEFAULT_POSITION = { x:0, y:0 };

//Node Transformation
export function transformNode(raw : RawNode, depth: number = 0): TopicNode | null{
    if(!raw.id || !raw.label || !raw.category || !raw.description || !Array.isArray(raw.seeds)){
        console.warn("TransformNode: skipping malformed node", raw);
        return null;
    }

    const colors = CATEGORY_COLORS[raw.category] ?? CATEGORY_COLORS["concept"];
    const obscure = OBSCURITY_STYLES[raw.obscurity ?? 1];

    const data: TopicNodeData = {
        label: raw.label,
        category: raw.category,
        description: raw.description,
        seeds: raw.seeds,
        obscurity: raw.obscurity ?? 1,
        expanded: false,
        expanding: false,
        isRoot: raw.id === "root",
        depth,
        imageUrl: null,
    }

    const node: TopicNode = {
        id: raw.id,
        type: "topicNode",
        position: DEFAULT_POSITION,
        data,
        style: {
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        color: colors.text,
        boxShadow: obscure.glowIntensity !== "none"
        ? obscure.glowIntensity
        : undefined,
        },
    };
    return node;
}

//Edge Transformation
export function transformEdge(raw: RawEdge, ObscurityLvl: 1 | 2 | 3 = 1, isCrossEdge: boolean = false): TopicEdge | null{
    if(!raw.id || !raw.source || !raw.target || !raw.label){
        console.warn("TransformEdge: skipping malformed edge", raw);
        return null;
    }

    const obscure = OBSCURITY_STYLES[ObscurityLvl];
    
    const data: TopicEdgeData = {
        label: raw.label,
        relationshipType: null,
        obscurity: ObscurityLvl,
        isCrossEdge,
    };

    const edge: TopicEdge = {
        id: raw.id,
        source: raw.source,
        target: raw.target,
        sourceHandle: "source",
        targetHandle: "target",
        data,
        animated: true,
        style: {
        stroke: isCrossEdge ? "#888" : "#555",
        strokeWidth: ObscurityLvl === 3 ? 2 : 1,
        strokeDasharray: obscure.edgeStyle === "dashed" ? "5,5" : undefined,
        opacity: obscure.edgeOpacity,
        },
        markerEnd: {
        type:  MarkerType.ArrowClosed,
        color: isCrossEdge ? "#888" : "#555",
        },
    };
    return edge
}

//CrossEdge Transformation
export function transformCrossEdge(raw: RawCrossEdge, existingNodes: Array<{id:string, label:string}>): TopicEdge | null {
    const sourceId = resolveLabelToId(raw.sourceLabel, existingNodes);
    const targetId = resolveLabelToId(raw.targetLabel, existingNodes);

    if(!sourceId || !targetId){
        console.warn("TransformCrossEdge: could not resolve labels to IDs", {sourceLabel: raw.sourceLabel, targetLabel: raw.targetLabel});
        return null;
    }

    //Avoids self-loops
    if(sourceId === targetId){
        console.warn("TransformCrossEdge: self-looping", raw);
        return null;
    }

    const resolvedEdge: RawEdge = {
        id: raw.id,
        source: sourceId,
        target: targetId,
        label: raw.label,
    };

    return transformEdge(resolvedEdge, 2, true);
}

//Batch transforms
export function transformNodes(rawNodes: RawNode[], depthMap: Record<string, number> = {}): TopicNode[]{
    return rawNodes.map((raw) => transformNode(raw, depthMap[raw.id] ?? 0)).filter((n): n is TopicNode => n !== null);
}

export function transformEdges(rawEdges: RawEdge[], nodes: TopicNode[]): TopicEdge[]{
    return rawEdges.map((raw) => {
       
        const sourceNode = nodes.find((n) => n.id === raw.source);
        const targetNode = nodes.find((n) => n.id === raw.target);

        const obscurity = Math.max(sourceNode?.data.obscurity ?? 1, targetNode?.data.obscurity ?? 1) as 1 | 2 | 3;

        return transformEdge(raw, obscurity, false);
    }).filter((e): e is TopicEdge => e !== null);
}

export function transformCrossEdges(rawCrossEdges: RawCrossEdge[], existingNodes: Array<{ id: string; label: string}>): TopicEdge[]{
    return rawCrossEdges.map((raw) => transformCrossEdge(raw, existingNodes)).filter((e): e is TopicEdge => e !== null);
}

//DeDuplication
export function deduplicateNodes(existingNodes: TopicNode[], newNodes: TopicNode[]): TopicNode[]{
    const existingSlugs = new Set(existingNodes.map((n) => slugify(n.data.label)));
    return newNodes.filter((n) => {
        const slug = slugify(n.data.label);
        if(existingSlugs.has(slug)){
            console.warn("deduplicateNodes: duplicate nodes", n.data.label);
            return false;
        }
        return true;
    });
}

export function deduplicateEdges(existingEdges: TopicEdge[], newEdges: TopicEdge[]): TopicEdge[]{
    const existingIds = new Set(existingEdges.map((e) => e.id));
    const existingPairs = new Set(existingEdges.map((e) => `${e.source}->${e.target}`));

    return newEdges.filter((e) => {
        if(existingIds.has(e.id)) return false;
        if(existingPairs.has(`${e.source}->${e.target}`)) return false;
        return true;
    });
}


