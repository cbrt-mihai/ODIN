import { v4 as uuidv4 } from "uuid";
import type { Case, Entity } from "@/lib/types";
import { rewireEntitiesAfterMerge } from "@/lib/entities/rewire";

export type IdMap = Record<string, string>;

export function applyIdMapToEntity(entity: Entity, idMap: IdMap): Entity {
  let result = { ...entity };
  if (idMap[entity.id]) {
    result = { ...result, id: idMap[entity.id] };
  }
  const sections = result.sections.map((sec) => ({
    ...sec,
    fields: sec.fields.map((f) => {
      if (f.type === "entityLink") {
        const data = f.value.data as { entityId?: string };
        if (data?.entityId && idMap[data.entityId]) {
          return {
            ...f,
            value: {
              ...f.value,
              data: { ...data, entityId: idMap[data.entityId] },
            },
          };
        }
      }
      return f;
    }),
  }));
  result = { ...result, sections };
  if (result.caseIds) {
    result.caseIds = result.caseIds.map((id) => idMap[id] ?? id);
  }
  if (result.groupIds) {
    result.groupIds = result.groupIds.map((id) => idMap[id] ?? id);
  }
  return result;
}

export function applyIdMapToCase(caseData: Case, idMap: IdMap): Case {
  return {
    ...caseData,
    id: idMap[caseData.id] ?? caseData.id,
    entityIds: caseData.entityIds.map((id) => idMap[id] ?? id),
    linkedCaseIds: (caseData.linkedCaseIds ?? []).map((id) => idMap[id] ?? id),
    groupIds: (caseData.groupIds ?? []).map((id) => idMap[id] ?? id),
    events: caseData.events.map((ev) => ({
      ...ev,
      entityIds: (ev.entityIds ?? []).map((id) => idMap[id] ?? id),
    })),
  };
}

export function rewireAllEntitiesForIdMap(
  entities: Entity[],
  idMap: IdMap,
): Entity[] {
  let result = entities;
  for (const [oldId, newId] of Object.entries(idMap)) {
    if (oldId === newId) continue;
    const primary = result.find((e) => e.id === newId);
    const secondary = result.find((e) => e.id === oldId);
    if (primary && secondary) {
      result = rewireEntitiesAfterMerge(result, oldId, primary, secondary);
    }
  }
  return result.map((e) => {
    if (idMap[e.id] && idMap[e.id] !== e.id) {
      return { ...e, id: idMap[e.id] };
    }
    return e;
  });
}

export function newIdFor(oldId: string, idMap: IdMap): string {
  if (idMap[oldId]) return idMap[oldId];
  const next = uuidv4();
  idMap[oldId] = next;
  return next;
}
