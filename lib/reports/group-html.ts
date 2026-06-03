import { renderGroupReportBody } from "@/lib/reports/content-html";
import { reportDocumentShell } from "@/lib/reports/report-styles";
import { escHtml } from "@/lib/reports/shared";
import type { ReportMediaContext } from "@/lib/reports/media";
import type { Case, Entity, Group, Playbook, Relationship, Resource, Settings, Tool } from "@/lib/types";

export async function renderGroupReportHtml(input: {
  group: Group;
  linked: Entity[];
  linkedCases: Case[];
  linkedGroups: Group[];
  relationships: Relationship[];
  tools?: Tool[];
  resources?: Resource[];
  playbooks?: Playbook[];
  allEntities: Entity[];
  settings: Pick<Settings, "confidenceTypes" | "relationshipTypes">;
  mediaCtx?: ReportMediaContext;
}) {
  const body = `
  <h1>${escHtml(input.group.title)}</h1>
  <p class="meta">Group report · Exported ${new Date().toLocaleString()}</p>
  ${await renderGroupReportBody(input)}
  `;
  return reportDocumentShell(`${input.group.title} — Group report`, body);
}
