import React from "react";
import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";
import { mergeScopeTimelineEvents } from "@/lib/investigation/stats";
import {
  CasePdfPages,
  EntityPdfPages,
  pdfStyles,
} from "@/lib/reports/pdf-blocks";
import type {
  Case,
  Entity,
  Playbook,
  Relationship,
  Resource,
  Settings,
  Tool,
} from "@/lib/types";
import { filterReportFields } from "./shared";
import { loadScopePdfImages } from "@/lib/reports/media";

export async function renderCaseReportPdf(input: {
  caseData: Case;
  linked: Entity[];
  linkedCases: Case[];
  relationships: Relationship[];
  tools: Tool[];
  resources: Resource[];
  playbooks: Playbook[];
  allEntities: Entity[];
  settings: Pick<Settings, "confidenceTypes" | "relationshipTypes">;
  pdfImages?: Map<string, string>;
}) {
  const confLabel = (id: string) =>
    input.settings.confidenceTypes.find((c) => c.id === id)?.label ?? id;

  const scopeIds = new Set(input.caseData.entityIds);
  const scopedRels = input.relationships.filter(
    (r) => scopeIds.has(r.fromEntityId) && scopeIds.has(r.toEntityId),
  );

  const timeline = mergeScopeTimelineEvents(
    input.caseData.events,
    input.linked,
  );

  const pdfImages =
    input.pdfImages ??
    (await loadScopePdfImages({
      entities: input.linked,
      caseProfile: input.caseData.profileImage,
      caseId: input.caseData.id,
    }));

  return renderToBuffer(
    <Document>
      <Page size="A4" style={pdfStyles.page} wrap>
        <CasePdfPages
          caseData={input.caseData}
          linked={input.linked}
          linkedCases={input.linkedCases}
          scopedRels={scopedRels}
          allEntities={input.allEntities}
          confLabel={confLabel}
          relationshipTypes={input.settings.relationshipTypes}
          confidenceTypes={input.settings.confidenceTypes}
          playbooks={input.playbooks}
          tools={input.tools}
          resources={input.resources}
          pdfImages={pdfImages}
        />
        <Text style={pdfStyles.h2}>Timeline</Text>
        {timeline.length === 0 ? (
          <Text>None</Text>
        ) : (
          timeline.map((ev) => (
            <Text key={`${ev.source}-${ev.id}`} style={pdfStyles.bullet}>
              {ev.occurredAt.slice(0, 16)} — {ev.title}
              {ev.endAt ? ` → ${ev.endAt.slice(0, 16)}` : ""}
              {ev.sourceLabel ? ` (${ev.sourceLabel})` : ""}
            </Text>
          ))
        )}
      </Page>
      {input.linked.map((entity) => {
        const sections = filterReportFields(
          entity.sections,
          input.settings.confidenceTypes,
          true,
        );
        return (
          <Page key={entity.id} size="A4" style={pdfStyles.page} wrap>
            <EntityPdfPages
              entity={entity}
              sections={sections}
              relationships={input.relationships}
              linked={input.allEntities}
              allEntities={input.allEntities}
              confLabel={confLabel}
              relationshipTypes={input.settings.relationshipTypes}
              confidenceTypes={input.settings.confidenceTypes}
              pdfImages={pdfImages}
            />
          </Page>
        );
      })}
    </Document>,
  );
}
