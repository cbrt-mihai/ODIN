import { getCaseById, listCases } from "@/lib/actions/cases";
import { listEntities } from "@/lib/actions/entities";
import { getGroupById, listGroups } from "@/lib/actions/groups";
import { listRelationships } from "@/lib/actions/relationships";
import { listPlaybooks } from "@/lib/actions/playbooks";
import { listResources } from "@/lib/actions/resources";
import { listTools } from "@/lib/actions/tools";
import {
  collectCaseReportEntityIds,
  collectGroupReportEntityIds,
  entitiesForIds,
  resolveCaseLinkedGroups,
  resolveGroupLinkedGroups,
} from "@/lib/reports/scope";
import { getSettings } from "@/lib/storage";

export async function loadCaseReportContext(caseId: string) {
  const [
    caseData,
    entities,
    settings,
    relationships,
    playbooks,
    tools,
    resources,
    allCases,
    allGroups,
  ] = await Promise.all([
    getCaseById(caseId),
    listEntities(),
    getSettings(),
    listRelationships(),
    listPlaybooks(),
    listTools(),
    listResources(),
    listCases(),
    listGroups(),
  ]);

  if (!caseData) return null;

  const linkedCases = allCases.filter((c) =>
    (caseData.linkedCaseIds ?? []).includes(c.id),
  );
  const linkedGroups = resolveCaseLinkedGroups(caseData, allGroups);
  const linkedEntityIds = collectCaseReportEntityIds(
    caseData,
    linkedCases,
    linkedGroups,
  );
  const linked = entitiesForIds(entities, linkedEntityIds);

  return {
    caseData,
    linked,
    linkedCases,
    linkedGroups,
    relationships,
    playbooks,
    tools,
    resources,
    allEntities: entities,
    settings,
  };
}

export async function loadGroupReportContext(groupId: string) {
  const [
    group,
    entities,
    cases,
    allGroups,
    relationships,
    settings,
    playbooks,
    tools,
    resources,
  ] = await Promise.all([
    getGroupById(groupId),
    listEntities(),
    listCases(),
    listGroups(),
    listRelationships(),
    getSettings(),
    listPlaybooks(),
    listTools(),
    listResources(),
  ]);

  if (!group) return null;

  const linkedCases = cases.filter((c) =>
    (group.caseIds ?? []).includes(c.id),
  );
  const linkedGroups = resolveGroupLinkedGroups(group, allGroups);
  const linkedEntityIds = collectGroupReportEntityIds(
    group,
    linkedCases,
    linkedGroups,
  );
  const linked = entitiesForIds(entities, linkedEntityIds);

  return {
    group,
    linked,
    linkedCases,
    linkedGroups,
    relationships,
    playbooks,
    tools,
    resources,
    allEntities: entities,
    settings,
  };
}
