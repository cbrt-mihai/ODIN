"use server";

import { collectFieldValues } from "@/lib/entities/contact-fields";
import { getEntities } from "@/lib/storage";
import type { Entity } from "@/lib/types";

export type DuplicateMatchReason = "name" | "email" | "phone";

export interface DuplicateCluster {
  id: string;
  entities: Entity[];
  reasons: DuplicateMatchReason[];
  score: number;
}

export async function findDuplicateCandidates(
  displayName: string,
  aliases: string[] = [],
  excludeId?: string,
  options?: { emails?: string[]; phones?: string[] },
) {
  const trimmed = displayName.trim();
  if (trimmed.length < 3 && !options?.emails?.length && !options?.phones?.length) {
    return [];
  }

  const entities = await getEntities();
  const names = [
    displayName.trim().toLowerCase(),
    ...aliases.map((a) => a.trim().toLowerCase()),
  ].filter(Boolean);

  const emails = (options?.emails ?? [])
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const phones = (options?.phones ?? [])
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  const seen = new Set<string>();
  const results: Entity[] = [];

  for (const e of entities) {
    if (excludeId && e.id === excludeId) continue;

    const hay = [
      e.displayName.toLowerCase(),
      ...(e.aliases ?? []).map((a) => a.toLowerCase()),
    ];
    const nameMatch = names.some(
      (n) =>
        n.length >= 3 &&
        hay.some((h) => h === n || h.includes(n) || n.includes(h)),
    );

    const entityEmails = collectFieldValues(e, "email");
    const entityPhones = collectFieldValues(e, "phone");
    const emailMatch = emails.some((em) => entityEmails.includes(em));
    const phoneMatch = phones.some((ph) => entityPhones.includes(ph));

    if (nameMatch || emailMatch || phoneMatch) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        results.push(e);
      }
    }
  }

  return results;
}

function entityNames(entity: Entity): string[] {
  return [
    entity.displayName.trim().toLowerCase(),
    ...(entity.aliases ?? []).map((a) => a.trim().toLowerCase()),
  ].filter((n) => n.length >= 3);
}

function pairMatch(
  a: Entity,
  b: Entity,
): { match: boolean; reasons: DuplicateMatchReason[]; score: number } {
  const reasons: DuplicateMatchReason[] = [];
  let score = 0;

  const aNames = entityNames(a);
  const bHay = [
    b.displayName.toLowerCase(),
    ...(b.aliases ?? []).map((x) => x.toLowerCase()),
  ];
  const aHay = [
    a.displayName.toLowerCase(),
    ...(a.aliases ?? []).map((x) => x.toLowerCase()),
  ];
  const bNames = entityNames(b);
  const nameMatch = aNames.some((n) =>
    bHay.some((h) => h === n || h.includes(n) || n.includes(h)),
  ) || bNames.some((n) =>
    aHay.some((h) => h === n || h.includes(n) || n.includes(h)),
  );
  if (nameMatch) {
    reasons.push("name");
    const exact = aNames.some((n) => bHay.some((h) => h === n));
    score = Math.max(score, exact ? 90 : 60);
  }

  const aEmails = collectFieldValues(a, "email");
  const bEmails = collectFieldValues(b, "email");
  if (aEmails.some((em) => bEmails.includes(em))) {
    reasons.push("email");
    score = Math.max(score, 95);
  }

  const aPhones = collectFieldValues(a, "phone");
  const bPhones = collectFieldValues(b, "phone");
  if (aPhones.some((ph) => bPhones.includes(ph))) {
    reasons.push("phone");
    score = Math.max(score, 95);
  }

  return { match: reasons.length > 0, reasons, score };
}

class UnionFind {
  private parent: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
  }

  find(i: number): number {
    if (this.parent[i] !== i) {
      this.parent[i] = this.find(this.parent[i]);
    }
    return this.parent[i];
  }

  union(i: number, j: number) {
    const ri = this.find(i);
    const rj = this.find(j);
    if (ri !== rj) this.parent[ri] = rj;
  }
}

export async function scanWorkspaceDuplicates(): Promise<DuplicateCluster[]> {
  const entities = await getEntities();
  const uf = new UnionFind(entities.length);
  const pairScores = new Map<string, number>();
  const pairReasons = new Map<string, Set<DuplicateMatchReason>>();

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const { match, reasons, score } = pairMatch(entities[i], entities[j]);
      if (!match) continue;
      uf.union(i, j);
      const key = [entities[i].id, entities[j].id].sort().join(":");
      pairScores.set(key, Math.max(pairScores.get(key) ?? 0, score));
      const reasonSet = pairReasons.get(key) ?? new Set<DuplicateMatchReason>();
      for (const r of reasons) reasonSet.add(r);
      pairReasons.set(key, reasonSet);
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < entities.length; i++) {
    const root = uf.find(i);
    const list = groups.get(root) ?? [];
    list.push(i);
    groups.set(root, list);
  }

  const clusters: DuplicateCluster[] = [];

  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    const members = indices.map((i) => entities[i]);
    const clusterReasons = new Set<DuplicateMatchReason>();
    let clusterScore = 0;

    for (let a = 0; a < members.length; a++) {
      for (let b = a + 1; b < members.length; b++) {
        const key = [members[a].id, members[b].id].sort().join(":");
        for (const r of pairReasons.get(key) ?? []) clusterReasons.add(r);
        clusterScore = Math.max(clusterScore, pairScores.get(key) ?? 0);
      }
    }

    const id = [...members].sort((x, y) => x.id.localeCompare(y.id))[0].id;
    clusters.push({
      id,
      entities: members,
      reasons: [...clusterReasons],
      score: clusterScore,
    });
  }

  return clusters.sort((a, b) => b.score - a.score || b.entities.length - a.entities.length);
}
