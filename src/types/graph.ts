import type {Node, Edge} from "@xyflow/react";
import type { PromptCategory, ObscurityLvl, RelationshipType } from "@/lib/ai/prompts";
import { NapiUpdateInfo } from "next/dist/build/swc/generated-native";
export type {PromptCategory,ObscurityLvl,RelationshipType};

//Data stored inside every ReactFlow node
export interface TopicNodeData extends Record<string, unknown>{
    label: string;
    category: PromptCategory;
    description: string;
    seeds: string[];
    obscurity: ObscurityLvl;
    expanded: boolean; //has the user clicked to expand this node
    expanding: boolean; //clicked and loading expansion
    isRoot: boolean;
    depth: number;
}

//Data stored inside every ReactFlow edge
export interface TopicEdgeData extends Record<string, unknown>{
    label:string;
    relationShipType: RelationshipType | null;
    obscurity: ObscurityLvl;
    isCrossEdge: boolean;
}

//Actually node/edge
export type TopicNode = Node<TopicNodeData>;
export type TopicEdge = Node<TopicEdgeData>;

//Raw AI reponse (What ai returns before any processing)
export interface RawNode{
    id: string;
    label: string;
    category: PromptCategory;
    description: string;
    seeds: string[];
    obscurity: ObscurityLvl;
}


export interface RawEdge{
    id: string;
    source: string;
    target: string;
    label: string;
}

//Uses labels instead of ID
export interface RawCrossEdge{
    id: string;
    sourceLabel: string;
    targetLabel: string;
    label: string;
}

//Shape of full generate response
export interface RawGenerateResponse{
    rootLabel: string;
    nodes: RawNode[];
    edges: RawEdge[];
}

//Shape of full expand response 
export interface RawExpandResponse{
    nodes: RawNode[];
    edges: RawEdge[];
    crossEdges: RawCrossEdge[];
}

//API route shapes (Request and Response contracts)
export interface GenerateRequest{
    topic: string;
}

export interface GenerateResponse{
    success: true;
    rootLabel: string;
    nodes: TopicNode[];
    edges: TopicEdge[];
}

export interface ExpandRequest{
    nodeId: string;
    nodeLabel: string;
    nodeCategory: PromptCategory;
    nodeDescription: string;
    existingLabels: string[];
    categoryCounts: Partial<Record<PromptCategory, number>>;
}

export interface ExpandResponse{
    success: true;
    nodes: TopicNode[];
    edges: TopicEdge[];
}

//Union error shape (both routes return this on failure)
export interface ErrorResponse{
    success: false;
    error: string;
    code: ErrorCode;
}

export type ApiResponse<T> = T | ErrorResponse;

//Error code
export type ErrorCode = | "INVALID_TOPIC" | "AI_PARSE_FAILED" | "AI_UNAVAIABLE" | "NODE_NOT_FOUND" | "EXPAND_FAILED" | "RATE_LIMITED" | "UNKNOWN";

//Graph State 
export type ExplorationStatus = | "idle" | "loading" | "ready" | "expanding" | "error";

export interface GraphState{
    //Canvas
    nodes: TopicNode[];
    edges: TopicEdge[];
    
    //Session
    rootTopic: string | null;
    status: ExplorationStatus;
    error: string | null;   

    //History
    history: HistoryEntry[];
    historyIndex: number;

    //Actions
    generateGraph: (topic: string) => Promise<void>;
    expandNode: (topic: string) => Promise<void>;
    resetGraph: () => void;
    travelTo: (index: number) => void;
}

//Used for history navigation
export interface HistoryEntry{
    nodes: TopicNode[];
    edges: TopicEdge[];
    timestamp: number;
    trigger: string; //label of the node that caused this state
}

//Visual constants
export const CATEGORY_COLORS: Record<PromptCategory, {background: string; border: string; text: string;}> = {
  concept:    { background: "#0f0a1e", border: "#7c3aed", text: "#a78bfa" },
  community:  { background: "#0a1f0f", border: "#16a34a", text: "#4ade80" },
  creator:    { background: "#1f0a0a", border: "#dc2626", text: "#f87171" },
  trend:      { background: "#1a1200", border: "#d97706", text: "#fbbf24" },
  platform:   { background: "#001a1f", border: "#0891b2", text: "#22d3ee" },
  event:      { background: "#1a0a1f", border: "#a21caf", text: "#e879f9" },
  opposition: { background: "#1f0d00", border: "#ea580c", text: "#fb923c" },
  aesthetic:  { background: "#001a18", border: "#0d9488", text: "#2dd4bf" },
  ideology:   { background: "#100a1f", border: "#4f46e5", text: "#818cf8" },
  media:      { background: "#1a1800", border: "#65a30d", text: "#bef264" },
};

export const OBSCURITY_STYLES: Record<ObscurityLvl, {
    nodeClass: string;
    edgeOpacity: number;
    glowIntensity: string;
    edgeStyle: "solid" | "dashed";
}> = {
     1: {
    nodeClass:     "node-obvious",
    edgeOpacity:   0.5,
    glowIntensity: "none",
    edgeStyle:     "solid",
  },
  2: {
    nodeClass:     "node-interesting",
    edgeOpacity:   0.75,
    glowIntensity: "0 0 8px rgba(108, 99, 255, 0.4)",
    edgeStyle:     "solid",
  },
  3: {
    nodeClass:     "node-surprising",
    edgeOpacity:   1.0,
    glowIntensity: "0 0 16px rgba(108, 99, 255, 0.85)",
    edgeStyle:     "dashed",
  },
};