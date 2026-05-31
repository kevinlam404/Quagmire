export type PromptCategory = | "concept" | "community" | "creator" | "trend" | "platform" | "event" | "opposition" | "aesthetic" | "ideology" | "media";

export type ObscurityLvl = 1 | 2 | 3;

//Reserved foor future edge classification
export type RelationshipType = | "causal" | "inspired_by" | "reaction_to" | "aethetic_overlap" | "pipeline" | "commercialized_by" | "historical_origin" | "cultural_backlash" | "ideological_overlap";

export const CATEGORY_DESCRIPTIONS: Record<PromptCategory, string> = {
    concept: "An idea, theory, or philosophy",
    community: "A group, subculture, or fandom",
    creator: "A person chanel, or account that shaped this topic",
    trend: "A viral moment, meme, or cultural wave",
    platform: "A website, app, or space where this lives",
    event: "A specific moment that changed the conversation",
    opposition: "A counter-movement, criticism, or opposing viewpoint",
    aesthetic: "A visual style, vibe, or cultural look-and-feel",
    ideology: "A belief system, worldview, or political lens",
    media: "A specific piece of content: film, book, video, post",
};

//System prompt
export const SYSTEM_PROMPT = `
You are the knowledge graph engine for Quagmire - an app that maps out how internet culture, ideas, and rabbit holes connect.

Your voice: smart but conversational. Internet-native but not cringe. Slightly conspiratorial curiosity. Confident but never academic.  You write like someone who has spent three hours on a Wikipedia spiral and wants to tell their friend what they found.


Output rules:
-Return ONLY valid JSON
-No markdown, no code fences, no explanations, no trailing text, use double quotes for all strings, no trailing commas
`.trim();

//Shared rule blocks
const EDGE_RULES = `
-Edge labels must describe real relationships, 
-Avoid vague labels
-Never use: "related to", "connected to", "part of"
-Good exmaples: "monetized the backlash against", "gave academic cover to", "aestheticized into lifestyle brand"
`.trim();

const DESCRIPTION_RULES = `
-Description must be 2-3 sentences max
-Write naturally and conversationally, in Quagmire's voice
-Never sound  academic or dry, make it fun and engaging to read
-Never use phrases like "is a term used to describe", "refers to"
`.trim();

const SEED_RULES = `
-Seed must be 2-6 word phrase referencing specific subcultures, people, events, or memes (never broad topics)
-Make them specific and curiosity-inducing (make someone want to click on them)
-Prefer categories like "memes", "aesthetics", "subcultures", "scandals", "creators", or "events"
-Avoid generic topics like "social media", "internet culture", or "online communities"
`.trim();

const OBSCURITY_RULES = `
-Obscurity 1 = obvious
-Obscurity 2 = interesting
-Obscurity 3 = surprising not convincing
-Aim for at least 2 obscurity level 3 nodes.
-At least one node must feel initially unexpected but inevitable after reading the description
`.trim();

const CATEGORY_RULES = `
Prefer underused categories:
-events
-opposition
-aesthetic
-ideology
-media

Avoid overusing:
-creator
-trend
`.trim();

//User prompt
export const buildGeneratePrompt = (topic: string): string => `
The user has entered a topic into Quagmire. Build the opening knowledge graph for this topic - the first pull into the rabbit hole.

TOPIC: "${topic}"

STRUCTURE RULES:
- Return 8 to 12 nodes total, including the root node
- Root node MUST have id "root" and represent the topic itself
- Every node must connect to at least one other node with an edge
- At least 2 edges must connect two non-root nodes to each other (create chains, not just spokes)
- Use at least 4 different categories
- Avoid semantic duplicates
- Avoid filler nodes unless truly relevant

${EDGE_RULES}
${DESCRIPTION_RULES}
${SEED_RULES}
${OBSCURITY_RULES}
${CATEGORY_RULES}

CATEGORIES: 
"concept"
"community"
"creator"
"trend"
"platform"
"event"
"opposition"
"aesthetic"
"ideology"
"media"

Return EXACTLY this JSON shape:
{
    "rootLabel": "Topic Name",
    "nodes": [
        {
            "id": "root",
            "label": "Topic name",
            "category": "concept",
            "description": "Description here.",
            "seeds": ["seed one", "seed two"],
            "obscurity": 1
        }
    ],
    "edges": [
        {
            "id": "edge_1",
            "source": "root",
            "target": "node_example",
            "label": "popularized by"
        }
    ]
}
`.trim();

//Expanded prompt
export const buildExpandedPrompt = (
    nodeLabel: string,
    nodeCategory: PromptCategory,
    nodeDescription: string,
    existingLabels: string[],
    categoryCounts: Partial<Record<PromptCategory, number>>
): string => `
The user clicked a node in Quagmire.
Expand outward into deeper and more unexpected territory.

CLICKED NODE:
"${nodeLabel}"

CATEGORY:
"${nodeCategory}"

CONTEXT:
"${nodeDescription}"

EXISTING NODE:
${existingLabels.map((label) => `- "${label}"`).join("\n")}


CURRENT CATEGORY DISTRIBUTION:
${Object.entries(categoryCounts)
  .map(([category, count]) => `- ${category}: ${count}`)
  .join("\n")}

STRUCTURE RULES:
- Generate 4 to 6 NEW nodes
= Never recreate existing nodes
- Avoid semantic duplicates
- At least 2 edges must connect new nodes together
- Favor surprising but believable connections
- Every node must connect meaningfully

${EDGE_RULES}
${DESCRIPTION_RULES}
${SEED_RULES}
${OBSCURITY_RULES}
${CATEGORY_RULES}

crossEdges:
-Used to connect NEW nodes to EXISTING nodes
-sourceLabel and targetLabel must exactly match existing labels
- Never use category names like "opposition", "concept", "trend" as labels
- If you are not 100% sure of the exact label, do not include the crossEdge

CATEGORIES: 
"concept"
"community"
"creator"
"trend"
"platform"
"event"
"opposition"
"aesthetic"
"ideology"
"media"

Return EXACTLY this JSON shape:

{
  "nodes": [
    {
      "id": "node_example",
      "label": "Example Node",
      "category": "trend",
      "description": "Description here.",
      "seeds": ["seed one", "seed two"],
      "obscurity": 2
    }
  ],
  "edges": [
    {
      "id": "edge_example",
      "source": "node_example",
      "target": "node_other",
      "label": "evolved into"
    }
  ],
  "crossEdges": [
    {
      "id": "cross_1",
      "sourceLabel": "Example Node",
      "targetLabel": "Existing Node",
      "label": "inspired"
    }
  ]
}
`.trim();

//Utilities 
//Takes any string and converts it into a clean ID-safe slug (ex. Kevin Lam -> kevin_lam)
export const slugify = (label: string): string => 
    label
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

//Wraps slugify with a node_ prefix (ex. kevin lam -> node_kevin_lam)
export const buildNodeId = (label: string): string =>
    `node_${slugify(label)}`;

//Takes current array of nodes and retursn how many of each category exist
export const countCategories = (
    nodes: Array<{ category: PromptCategory}>
): Partial<Record<PromptCategory, number>> => 
nodes.reduce((acc, node) => {
    acc[node.category] = (acc[node.category] ?? 0) + 1;
    return acc;
}, {} as Partial<Record<PromptCategory, number>>);

//Uses labels instead of Id to fix crossEdging
export const resolveLabelToId = (
    label: string,
    existingNodes: Array<{id: string, label: string}>
): string | null => {
    const normalized = slugify(label);
    const match = existingNodes.find((n) => slugify(n.label) === normalized);
    return match?.id ?? null;
};