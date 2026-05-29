import {create} from "zustand";
import {buildGraph } from "@/lib/graph/buildGraph";
import {expandNode as expandNodeFn} from "@/lib/graph/expandNode";
import {countCategories} from "@/lib/ai/prompts";
import type { GraphState, TopicNode, TopicEdge, HistoryEntry, RawGenerateResponse, RawExpandResponse, PromptCategory} from "@/types/graph";

//Initial state
const INITIAL_STATE = {
    nodes: [] as TopicNode[],
    edges: [] as TopicEdge[],
    rootTopic: null as string | null,
    status: "idle" as const,
    error: null as string | null,
    history: [] as HistoryEntry[],
    historyIndex: -1,
};

//History helper
function createHistoryEntry(nodes: TopicNode[], edges: TopicEdge[], trigger: string): HistoryEntry{
    return {
        nodes: [...nodes],
        edges: [...edges],
        timestamp: Date.now(),
        trigger,
    };
}

//Store
export const useGraph = create<GraphState>((set, get) => ({
  ...INITIAL_STATE,

  //Generate graph
  generateGraph: async (topic: string) => {
    set({ status: "loading", error: null });

    try {
      const response = await fetch("/api/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topic }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        set({
          status: "error",
          error:  data.error ?? "Failed to generate graph",
        });
        return;
      }

      const raw = data as RawGenerateResponse & { success: true };
      const { nodes, edges } = buildGraph(raw);

      const entry = createHistoryEntry(nodes, edges, topic);

      set({
        nodes,
        edges,
        rootTopic: topic,
        status: "ready",
        error: null,
        history: [entry],
        historyIndex: 0,
      });

    } catch {
      set({
        status: "error",
        error: "Network error. Make sure you paid your wifi bill this month lol",
      });
    }
  },

  //Expand node
  expandNode: async (nodeId: string) => {
    const { nodes, edges } = get();

    const node = nodes.find((n) => n.id === nodeId);

    if (!node) {
      console.warn("expandNode: node not found", nodeId);
      return;
    }

    // Don't re-expand already expanded nodes
    if (node.data.expanded) return;

    // Mark node as expanding
    set({
      status: "expanding",
      nodes:  nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, expanding: true } }
          : n
      ),
    });

    try {
      const existingLabels  = nodes.map((n) => n.data.label);
      const categoryCounts  = countCategories(
        nodes.map((n) => ({ category: n.data.category }))
      );

      const response = await fetch("/api/expand", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId,
          nodeLabel: node.data.label,
          nodeCategory: node.data.category as PromptCategory,
          nodeDescription: node.data.description,
          existingLabels,
          categoryCounts,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Revert expanding state on failure
        set({
          status: "ready",
          error:  data.error ?? "Failed to expand node",
          nodes:  nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, expanding: false } }
              : n
          ),
        });
        return;
      }

      const raw = data as RawExpandResponse & { success: true };
      const { nodes: newNodes, edges: newEdges } = expandNodeFn(
        nodes,
        edges,
        raw,
        nodeId
      );

      const entry = createHistoryEntry(
        newNodes,
        newEdges,
        node.data.label
      );

      const { history, historyIndex } = get();

      // Trim any forward history if user went back then expanded
      const trimmedHistory = history.slice(0, historyIndex + 1);

      set({
        nodes: newNodes,
        edges: newEdges,
        status: "ready",
        error: null,
        history: [...trimmedHistory, entry],
        historyIndex: trimmedHistory.length,
      });

    } catch {
      // Revert expanding state on network error
      set({
        status: "ready",
        error:  "Network error. Make sure you paid your wifi bill this month lol",
        nodes:  nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, expanding: false } }
            : n
        ),
      });
    }
  },

  //Reset graph
  resetGraph: () => {
    set({ ...INITIAL_STATE });
  },

  //Travel to history entry
  travelTo: (index: number) => {
    const { history } = get();

    if (index < 0 || index >= history.length) {
      console.warn("travelTo: invalid history index", index);
      return;
    }

    const entry = history[index];

    set({
      nodes: entry.nodes,
      edges: entry.edges,
      status: "ready",
      error: null,
      historyIndex: index,
    });
  },
}));