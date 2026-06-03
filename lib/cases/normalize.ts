import { slugify } from "@/lib/utils";
import type { Case } from "@/lib/types";

export function normalizeCase(caseData: Case): Case {
  const titleSlug = slugify(caseData.title);
  return {
    ...caseData,
    slug: caseData.slug?.trim() || titleSlug || caseData.id.slice(0, 8),
    linkedCaseIds: caseData.linkedCaseIds ?? [],
    toolIds: caseData.toolIds ?? [],
    resourceIds: caseData.resourceIds ?? [],
    playbookIds: caseData.playbookIds ?? [],
    playbookProgress: caseData.playbookProgress ?? [],
    events: caseData.events ?? [],
    tags: caseData.tags ?? [],
    entityIds: caseData.entityIds ?? [],
    groupIds: caseData.groupIds ?? [],
  };
}
