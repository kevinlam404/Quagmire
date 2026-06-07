import { PromptCategory } from "@/types/graph";

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