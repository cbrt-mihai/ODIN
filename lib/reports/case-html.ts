import { renderCaseReportBody } from "@/lib/reports/content-html";
import { reportDocumentShell } from "@/lib/reports/report-styles";
import { escHtml } from "@/lib/reports/shared";
import type { Case, Entity, Playbook, Relationship, Resource, Settings, Tool } from "@/lib/types";

export async function renderCaseReportHtml(input: {
  caseData: Case;
  linked: Entity[];
  linkedCases: Case[];
  relationships: Relationship[];
  tools: Tool[];
  resources: Resource[];
  playbooks: Playbook[];
  allEntities: Entity[];
  settings: Pick<Settings, "confidenceTypes" | "relationshipTypes">;
}) {
  const body = `
  <h1>${escHtml(input.caseData.title)}</h1>
  <p class="meta">Case report · Exported ${new Date().toLocaleString()}</p>
  ${await renderCaseReportBody(input)}
  `;
  return reportDocumentShell(
    `${input.caseData.title} — Case report`,
    body,
  );
}
