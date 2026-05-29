import dagre from "@dagrejs/dagre";
import type { RawGenerateResponse, TopicNode, TopicEdge } from "@/types/graph";
import { transformNodes, transformEdges} from "@/lib/graph/transform";

//Constants
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

const DAGRE_CONFIG = {
    rankdir: "LR", //left to right layout
    ranksep: 120, //horizontal seperation between ranks
    nodesep: 60, //vertical seperation bteween nodes
    marginx: 40,
};

//Dagre layout
export function applyDagreLayout(nodes: TopicNode[], edges: TopicEdge[]): TopicNode[]{
    const graph = new dagre.graphlib.Graph();

    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph(DAGRE_CONFIG);

    //Register all nodes
    nodes.forEach((node) => {
        graph.setNode(node.id, {
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
        });
    });

    //Register all edges
    edges.forEach((edge) => {
        graph.setEdge(edge.source, edge.target);
    });

    //Run layout
    dagre.layout(graph);

    //Apply calcualted positions back to nodes
    return nodes.map((node) => {
        const pos = graph.node(node.id);
        if(!pos) return node;

        return{
            ...node,
            position: {
                x: pos.x - NODE_WIDTH / 2, 
                y: pos.y - NODE_HEIGHT / 2,
            }
        };
    });
}

//Depth Map (calculates node to root)
function buildDepthMap(rawNodes: Array<{id: string}>, rawEdges: Array<{source: string, target: string}>): Record<string, number>{
    const depthMap: Record<string, number> = {root : 0};
    const visited = new Set<string>(["root"]);
    const queue = ["root"];

    while(queue.length > 0){
        const current = queue.shift()!;
        const depth = depthMap[current] ?? 0;

        rawEdges.filter((e) => e.source === current).forEach((e)=> {
            if(!visited.has(e.target)){
                visited.add(e.target);
                depthMap[e.target] = depth + 1;
                queue.push(e.target);
            }
        });
    }

    rawNodes.forEach((n) => {
        if(depthMap[n.id] === undefined){
            depthMap[n.id] = 1;
        }
    });

    return depthMap;
}

//Build graph
export function buildGraph(raw: RawGenerateResponse):{
    nodes: TopicNode[];
    edges: TopicEdge[];
} {
    if(!raw.nodes?.length){
        console.warn("buildGraph: no nodes in response");
        return { nodes: [], edges: []};
    }

    //Build depth map before transforming
    const depthMap = buildDepthMap(raw.nodes, raw.edges);

    const nodes = transformNodes(raw.nodes, depthMap);
    const edges = transformEdges(raw.edges, nodes);
    const positionedNodes = applyDagreLayout(nodes, edges);

    return{
        nodes: positionedNodes,
        edges,
    };
}


