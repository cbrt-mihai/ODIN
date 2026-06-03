"use server";

import { listCases } from "@/lib/actions/cases";
import { listEntities } from "@/lib/actions/entities";
import { listGroups } from "@/lib/actions/groups";
import { listInboxItems } from "@/lib/actions/inbox";
import { listPlaybooks } from "@/lib/actions/playbooks";
import { listResources } from "@/lib/actions/resources";
import { listTools } from "@/lib/actions/tools";
import { buildEntityIdentityMap } from "@/lib/entities/identity";
import {
  entityFieldSearchBlob,
  findFieldMatches,
} from "@/lib/search/field-text";
import { migrateAnnotationsToLists, entriesSearchText } from "@/lib/entries/helpers";
import type { Entity } from "@/lib/types";

export interface SearchResult {
  id: string;
  type:
    | "entity"
    | "case"
    | "group"
    | "tool"
    | "resource"
    | "inbox"
    | "playbook";
  title: string;
  subtitle?: string;
  href: string;
  rank: number;
}

function entityRank(entity: Entity, q: string, metaMatch: boolean, fieldMatch: boolean): number {
  const name = entity.displayName.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 85;
  if ((entity.slug ?? "").toLowerCase() === q) return 80;
  if ((entity.aliases ?? []).some((a) => a.toLowerCase() === q)) return 75;
  if (fieldMatch) return 55;
  if (metaMatch) return 40;
  return 25;
}

function entitySubtitle(
  entity: Entity,
  q: string,
  metaMatch: boolean,
  fieldMatch: boolean,
): string {
  if (fieldMatch) {
    const hit = findFieldMatches(entity, q)[0];
    if (hit) return `${hit.sectionTitle} › ${hit.fieldLabel}`;
  }

  if (metaMatch) {
    const entityLists = migrateAnnotationsToLists(entity);
    const contextNotes = entriesSearchText(
      entityLists.contextEntries,
      entityLists.noteEntries,
    );
    if (contextNotes.toLowerCase().includes(q)) return "entity notes / context";

    for (const img of entity.gallery) {
      const imgLists = migrateAnnotationsToLists(img);
      const blob = [
        img.caption ?? "",
        entriesSearchText(imgLists.contextEntries, imgLists.noteEntries),
      ]
        .join(" ")
        .toLowerCase();
      if (blob.includes(q)) return "gallery";
    }

    for (const att of entity.attachments ?? []) {
      const attLists = migrateAnnotationsToLists(att);
      const blob = [
        att.filename,
        entriesSearchText(attLists.contextEntries, attLists.noteEntries),
      ]
        .join(" ")
        .toLowerCase();
      if (blob.includes(q)) return "attachment";
    }
  }

  return entity.type;
}

function entityHref(entity: Entity, q: string, fieldMatch: boolean): string {
  if (!fieldMatch) return `/entities/${entity.id}`;
  const hit = findFieldMatches(entity, q)[0];
  if (!hit) return `/entities/${entity.id}`;
  const params = new URLSearchParams({ field: hit.fieldId });
  if (hit.sectionId) params.set("section", hit.sectionId);
  return `/entities/${entity.id}?${params.toString()}`;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const [entities, cases, groups, tools, resources, inbox, playbooks] =
    await Promise.all([
      listEntities(),
      listCases(),
      listGroups(),
      listTools(),
      listResources(),
      listInboxItems(),
      listPlaybooks(),
    ]);

  const results: SearchResult[] = [];
  const identityMap = buildEntityIdentityMap(entities);

  for (const e of entities) {
    const identity = identityMap.get(e.id);
    const metaHay = [
      identity?.searchText,
      e.displayName,
      e.slug,
      e.disambiguator,
      ...(e.aliases ?? []),
      ...(e.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const fieldHay = entityFieldSearchBlob(e);
    const metaMatch = metaHay.includes(q);
    const fieldMatch = fieldHay.includes(q);

    if (metaMatch || fieldMatch) {
      const baseSubtitle = entitySubtitle(e, q, metaMatch, fieldMatch);
      results.push({
        id: e.id,
        type: "entity",
        title: identity?.isHomonym ? identity.qualifiedName : e.displayName,
        subtitle: identity?.isHomonym
          ? `@${identity.referenceSlug}${baseSubtitle ? ` · ${baseSubtitle}` : ""}`
          : baseSubtitle,
        href: entityHref(e, q, fieldMatch),
        rank: entityRank(e, q, metaMatch, fieldMatch),
      });
    }
  }

  for (const c of cases) {
    const title = c.title.toLowerCase();
    const match =
      title.includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      (c.tags ?? []).some((t) => t.toLowerCase().includes(q));
    if (match) {
      results.push({
        id: c.id,
        type: "case",
        title: c.title,
        subtitle: c.status,
        href: `/cases/${c.id}`,
        rank: title === q ? 90 : title.startsWith(q) ? 70 : 35,
      });
    }
  }

  for (const g of groups) {
    const title = g.title.toLowerCase();
    const match =
      title.includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      (g.tags ?? []).some((t) => t.toLowerCase().includes(q));
    if (match) {
      results.push({
        id: g.id,
        type: "group",
        title: g.title,
        subtitle: `${g.entityIds.length} entities`,
        href: `/groups/${g.id}`,
        rank: title === q ? 85 : 30,
      });
    }
  }

  for (const t of tools) {
    const name = t.name.toLowerCase();
    const match =
      name.includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q));
    if (match) {
      results.push({
        id: t.id,
        type: "tool",
        title: t.name,
        subtitle: t.kind,
        href: t.kind === "external" && t.url ? t.url : `/tools/${t.id}`,
        rank: name === q ? 80 : 30,
      });
    }
  }

  for (const r of resources) {
    const name = r.name.toLowerCase();
    const match =
      name.includes(q) || r.description?.toLowerCase().includes(q);
    if (match) {
      results.push({
        id: r.id,
        type: "resource",
        title: r.name,
        subtitle: r.kind,
        href: r.kind === "external" && r.url ? r.url : `/resources/${r.id}`,
        rank: name === q ? 75 : 28,
      });
    }
  }

  for (const pb of playbooks) {
    const title = pb.title.toLowerCase();
    const match =
      title.includes(q) ||
      pb.description?.toLowerCase().includes(q) ||
      pb.steps.some(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q),
      );
    if (match) {
      results.push({
        id: pb.id,
        type: "playbook",
        title: pb.title,
        subtitle: `${pb.steps.length} steps`,
        href: `/playbooks`,
        rank: title === q ? 72 : 28,
      });
    }
  }

  for (const item of inbox) {
    if (
      item.content.toLowerCase().includes(q) ||
      item.notes?.toLowerCase().includes(q)
    ) {
      results.push({
        id: item.id,
        type: "inbox",
        title: item.content.slice(0, 60),
        subtitle: item.status,
        href: `/inbox?item=${item.id}`,
        rank: 20,
      });
    }
  }

  return results.sort((a, b) => b.rank - a.rank).slice(0, 50);
}
