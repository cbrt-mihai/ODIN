import type { ConfidenceTypeDefinition } from "@/lib/types";

export function sortedConfidenceTypes(
  types: ConfidenceTypeDefinition[],
): ConfidenceTypeDefinition[] {
  return [...types].sort((a, b) => a.order - b.order);
}

export function confidenceType(
  id: string,
  types: ConfidenceTypeDefinition[],
): ConfidenceTypeDefinition | undefined {
  return types.find((t) => t.id === id);
}

export function isDebunked(
  confidenceId: string,
  types: ConfidenceTypeDefinition[],
): boolean {
  const t = confidenceType(confidenceId, types);
  return t?.isTerminal === true || confidenceId === "debunked";
}

export function confidenceBadgeStyle(
  confidenceId: string,
  types: ConfidenceTypeDefinition[],
): { backgroundColor?: string; color?: string } {
  const color = confidenceType(confidenceId, types)?.color;
  return color ? { backgroundColor: `${color}33`, color } : {};
}
