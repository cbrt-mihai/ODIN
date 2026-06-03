import {
  BUILTIN_ENTITY_TYPES,
  isValidEntityTypeId,
} from "@/lib/entities/entity-types";
import type { EntityType } from "@/lib/types";

export type GraphColorBy = "entityType" | "case" | "group";
export type GraphClusterBy = "none" | "case" | "group";
export type GraphHops = 1 | 2 | 3 | "all";

export type GraphViewState = {
  search: string;
  entityTypes: EntityType[];
  relationshipTypes: string[];
  caseId: string | null;
  groupId: string | null;
  tags: string[];
  tagMode: "any" | "all";
  minConfidence: string | null;
  showIsolates: boolean;
  hops: GraphHops;
  focusId: string | null;
  gravity: boolean;
  colorBy: GraphColorBy;
  clusterBy: GraphClusterBy;
};

export const DEFAULT_GRAPH_VIEW_STATE: GraphViewState = {
  search: "",
  entityTypes: [],
  relationshipTypes: [],
  caseId: null,
  groupId: null,
  tags: [],
  tagMode: "any",
  minConfidence: null,
  showIsolates: false,
  hops: 2,
  focusId: null,
  gravity: false,
  colorBy: "entityType",
  clusterBy: "none",
};

function parseList(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseEntityTypes(
  raw: string | null,
  knownTypes: readonly EntityType[] = BUILTIN_ENTITY_TYPES,
): EntityType[] {
  const known = new Set(knownTypes);
  return parseList(raw).filter(
    (t): t is EntityType => isValidEntityTypeId(t) && known.has(t),
  );
}

export function graphViewStateFromSearchParams(
  params: URLSearchParams,
  knownEntityTypes?: EntityType[],
): GraphViewState {
  const hopsRaw = params.get("hops");
  let hops: GraphHops = 2;
  if (hopsRaw === "all") hops = "all";
  else if (hopsRaw === "1") hops = 1;
  else if (hopsRaw === "3") hops = 3;

  const clusterRaw = params.get("cluster");
  const clusterBy: GraphClusterBy =
    clusterRaw === "case" || clusterRaw === "group" ? clusterRaw : "none";

  const colorRaw = params.get("color");
  const colorBy: GraphColorBy =
    colorRaw === "case" || colorRaw === "group" ? colorRaw : "entityType";

  return {
    search: params.get("q") ?? "",
    entityTypes: parseEntityTypes(params.get("types"), knownEntityTypes),
    relationshipTypes: parseList(params.get("rels")),
    caseId: params.get("case") || null,
    groupId: params.get("group") || null,
    tags: parseList(params.get("tags")),
    tagMode: params.get("tagMode") === "all" ? "all" : "any",
    minConfidence: params.get("conf") || null,
    showIsolates: params.get("isolates") === "1",
    hops,
    focusId: params.get("focus") || null,
    gravity: params.get("gravity") === "1",
    colorBy,
    clusterBy,
  };
}

export function graphViewStateToSearchParams(
  state: GraphViewState,
): URLSearchParams {
  const p = new URLSearchParams();
  if (state.search.trim()) p.set("q", state.search.trim());
  if (state.entityTypes.length)
    p.set("types", state.entityTypes.join(","));
  if (state.relationshipTypes.length)
    p.set("rels", state.relationshipTypes.join(","));
  if (state.caseId) p.set("case", state.caseId);
  if (state.groupId) p.set("group", state.groupId);
  if (state.tags.length) p.set("tags", state.tags.join(","));
  if (state.tagMode === "all") p.set("tagMode", "all");
  if (state.minConfidence) p.set("conf", state.minConfidence);
  if (state.showIsolates) p.set("isolates", "1");
  if (state.hops !== 2) p.set("hops", String(state.hops));
  if (state.focusId) p.set("focus", state.focusId);
  if (state.gravity) p.set("gravity", "1");
  if (state.colorBy !== "entityType") p.set("color", state.colorBy);
  if (state.gravity && state.clusterBy !== "none")
    p.set("cluster", state.clusterBy);
  return p;
}
