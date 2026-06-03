"use client";

import { memo, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { entityTypeLabel } from "@/lib/entities/entity-types";
import { layoutEntityGraphPositions } from "@/lib/relationships/graph-layout";
import { resolveEntityNodeColor } from "@/lib/relationships/graph-colors";
import { runForceGraphLayout } from "@/lib/relationships/graph-force-layout";
import {
  relationshipEdgeLabelForViewer,
  type RelationshipTypeOption,
} from "@/lib/relationships/helpers";
import type { GraphClusterBy, GraphColorBy } from "@/lib/relationships/graph-view-state";
import type {
  Case,
  Entity,
  EntityType,
  Group,
  Relationship,
  Settings,
} from "@/lib/types";

type EntityNodeData = {
  displayName: string;
  entityTypeLabel: string;
  isCenter: boolean;
  color: string;
};

function EntityNode({ data }: NodeProps<Node<EntityNodeData>>) {
  return (
    <div
      className="cursor-grab rounded-lg px-2 py-2 text-xs text-white active:cursor-grabbing"
      style={{
        background: data.color,
        border: data.isCenter ? "2px solid #fbbf24" : "1px solid #27272a",
        width: 140,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-zinc-600 !bg-zinc-400"
      />
      <div className="font-semibold truncate">{data.displayName}</div>
      <div className="truncate opacity-70">{data.entityTypeLabel}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-zinc-600 !bg-zinc-400"
      />
    </div>
  );
}

const nodeTypes = { entity: memo(EntityNode) };

function FitViewOnLayout({ layoutKey }: { layoutKey: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const t = window.setTimeout(() => {
      fitView({ padding: 0.35, maxZoom: 1.2, duration: 200 });
    }, 50);
    return () => window.clearTimeout(t);
    // fitView from useReactFlow is not referentially stable — layoutKey only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);
  return null;
}

function buildGraph(
  center: Entity,
  entities: Entity[],
  relationships: Relationship[],
  relationshipTypes: RelationshipTypeOption[],
  options: {
    scopeIds?: Set<string>;
    colorBy: GraphColorBy;
    cases: Case[];
    groups: Group[];
    activeCaseId?: string | null;
    activeGroupId?: string | null;
    layoutMode: "static" | "force";
    clusterBy: GraphClusterBy;
    settings?: Pick<Settings, "entityTypes">;
  },
) {
  const relevant = options.scopeIds
    ? entities.filter((e) => options.scopeIds!.has(e.id))
    : entities;

  const colorOpts = {
    activeCaseId: options.activeCaseId,
    activeGroupId: options.activeGroupId,
    settings: options.settings,
  };

  const nodes: Node<EntityNodeData>[] = relevant.map((e) => ({
    id: e.id,
    type: "entity",
    position: { x: 0, y: 0 },
    data: {
      displayName: e.displayName,
      entityTypeLabel: entityTypeLabel(e.type, options.settings),
      isCenter: e.id === center.id,
      color: resolveEntityNodeColor(
        e,
        options.colorBy,
        options.cases,
        options.groups,
        colorOpts,
      ),
    },
  }));

  const scopedRelationships = relationships.filter(
    (r) =>
      relevant.some((e) => e.id === r.fromEntityId) &&
      relevant.some((e) => e.id === r.toEntityId),
  );

  const edges: Edge[] = scopedRelationships.map((r) => ({
    id: r.id,
    source: r.fromEntityId,
    target: r.toEntityId,
    label: relationshipEdgeLabelForViewer(
      center.id,
      r,
      relationshipTypes,
    ),
    animated: false,
    style: { stroke: "#52525b" },
    labelStyle: { fill: "#a1a1aa", fontSize: 10 },
    labelShowBg: false,
  }));

  const linkData = scopedRelationships.map((r) => ({
    source: r.fromEntityId,
    target: r.toEntityId,
    bidirectional: r.bidirectional,
  }));

  let positions = layoutEntityGraphPositions(
    center.id,
    relevant.map((e) => e.id),
    linkData,
  );

  if (options.layoutMode === "force") {
    positions = runForceGraphLayout(
      positions,
      linkData.map((l) => ({ source: l.source, target: l.target })),
      relevant,
      {
        clusterBy: options.clusterBy,
        cases: options.cases,
        groups: options.groups,
      },
    );
  }

  for (const node of nodes) {
    node.position = positions.get(node.id) ?? { x: 0, y: 0 };
  }

  return { nodes, edges };
}

function EntityGraphFlow({
  graph,
  layoutKey,
  height,
  colorBy,
  cases,
  groups,
  activeCaseId,
  activeGroupId,
  entityTypes,
  onFocusEntity,
  entityById,
}: {
  graph: { nodes: Node<EntityNodeData>[]; edges: Edge[] };
  layoutKey: string;
  height: number;
  colorBy: GraphColorBy;
  cases: Case[];
  groups: Group[];
  activeCaseId: string | null;
  activeGroupId: string | null;
  entityTypes?: Settings["entityTypes"];
  onFocusEntity?: (entityId: string) => void;
  entityById: Map<string, Entity>;
}) {
  const router = useRouter();
  const [nodes, , onNodesChange] = useNodesState(graph.nodes);
  const [edges, , onEdgesChange] = useEdgesState(graph.edges);

  return (
    <div
      className="entity-graph w-full max-w-full rounded-lg border border-zinc-800 overflow-hidden bg-zinc-950"
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        minZoom={0.2}
        colorMode="dark"
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(ev, node) => {
          if (ev.shiftKey && onFocusEntity) {
            onFocusEntity(node.id);
            return;
          }
          router.push(`/entities/${node.id}`);
        }}
      >
        <FitViewOnLayout layoutKey={layoutKey} />
        <Background color="#3f3f46" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const ent = entityById.get(n.id);
            if (!ent) return "#52525b";
            return resolveEntityNodeColor(ent, colorBy, cases, groups, {
              activeCaseId,
              activeGroupId,
              settings: entityTypes ? { entityTypes } : undefined,
            });
          }}
        />
      </ReactFlow>
    </div>
  );
}

export function EntityGraph({
  center,
  entities,
  relationships,
  relationshipTypes,
  scopeIds,
  height = 400,
  variant = "scoped",
  workspaceGraphHref,
  layoutMode = "static",
  colorBy = "entityType",
  clusterBy = "none",
  cases = [],
  groups = [],
  activeCaseId = null,
  activeGroupId = null,
  entityTypes,
  onFocusEntity,
}: {
  center: Entity;
  entities: Entity[];
  relationships: Relationship[];
  relationshipTypes: RelationshipTypeOption[];
  scopeIds?: string[];
  height?: number;
  variant?: "scoped" | "workspace";
  workspaceGraphHref?: string;
  layoutMode?: "static" | "force";
  colorBy?: GraphColorBy;
  clusterBy?: GraphClusterBy;
  cases?: Case[];
  groups?: Group[];
  activeCaseId?: string | null;
  activeGroupId?: string | null;
  entityTypes?: Settings["entityTypes"];
  onFocusEntity?: (entityId: string) => void;
}) {
  const scope = scopeIds ? new Set(scopeIds) : undefined;

  const layoutKey = useMemo(
    () =>
      [
        center.id,
        layoutMode,
        colorBy,
        clusterBy,
        entities.length,
        relationships.length,
        activeCaseId,
        activeGroupId,
      ].join("|"),
    [
      center.id,
      layoutMode,
      colorBy,
      clusterBy,
      entities.length,
      relationships.length,
      activeCaseId,
      activeGroupId,
    ],
  );

  const graph = useMemo(
    () =>
      buildGraph(center, entities, relationships, relationshipTypes, {
        scopeIds: scope,
        colorBy,
        cases,
        groups,
        activeCaseId,
        activeGroupId,
        layoutMode,
        clusterBy,
        settings: entityTypes ? { entityTypes } : undefined,
      }),
    [
      center,
      entities,
      relationships,
      relationshipTypes,
      scopeIds,
      colorBy,
      cases,
      groups,
      activeCaseId,
      activeGroupId,
      layoutMode,
      clusterBy,
      entityTypes,
    ],
  );

  const entityById = useMemo(
    () => new Map(entities.map((e) => [e.id, e])),
    [entities],
  );

  if (graph.nodes.length === 0) {
    return <p className="text-sm text-zinc-500">No entities to graph.</p>;
  }

  return (
    <div className="space-y-2">
      <EntityGraphFlow
        key={layoutKey}
        graph={graph}
        layoutKey={layoutKey}
        height={height}
        colorBy={colorBy}
        cases={cases}
        groups={groups}
        activeCaseId={activeCaseId}
        activeGroupId={activeGroupId}
        entityTypes={entityTypes}
        onFocusEntity={onFocusEntity}
        entityById={entityById}
      />
      <p className="text-xs text-zinc-500">
        Drag nodes to rearrange.
        {variant === "workspace" ? (
          <> Shift+click to set focus. Click to open entity.</>
        ) : (
          <> Click a node to open the entity.</>
        )}
        {variant === "scoped" && (
          <>
            {" "}
            Center:{" "}
            <Link
              href={`/entities/${center.id}`}
              className="text-blue-400 hover:underline"
            >
              {center.displayName}
            </Link>
            {workspaceGraphHref && (
              <>
                {" "}
                ·{" "}
                <Link
                  href={workspaceGraphHref}
                  className="text-blue-400 hover:underline"
                >
                  Open workspace graph
                </Link>
              </>
            )}
          </>
        )}
        {variant === "workspace" && (
          <>
            {" "}
            Center:{" "}
            <span className="text-zinc-400">{center.displayName}</span>
          </>
        )}
      </p>
    </div>
  );
}
