import { renderEntityReportBody } from "@/lib/reports/content-html";
import { reportDocumentShell } from "@/lib/reports/report-styles";
import { escHtml } from "@/lib/reports/shared";
import { getSettings } from "@/lib/storage";
import type { Entity, Relationship } from "@/lib/types";

export async function renderEntityReportHtml(
  entity: Entity,
  relationships: Relationship[],
  linked: Entity[],
) {
  const settings = await getSettings();
  const body = `
  <h1>${escHtml(entity.displayName)}</h1>
  <p class="meta">Entity report · Exported ${new Date().toLocaleString()} · Debunked fields omitted</p>
  ${await renderEntityReportBody(entity, relationships, linked, settings, {
    allEntities: linked,
  })}
  `;
  return reportDocumentShell(`${entity.displayName} — Report`, body);
}
