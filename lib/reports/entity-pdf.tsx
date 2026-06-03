import React from "react";
import { Document, Page, renderToBuffer } from "@react-pdf/renderer";
import { EntityPdfPages, pdfStyles } from "@/lib/reports/pdf-blocks";
import type { Entity, Relationship } from "@/lib/types";
import { getSettings } from "@/lib/storage";
import { filterReportFields } from "./shared";

export async function renderEntityReportPdf(
  entity: Entity,
  relationships: Relationship[],
  linked: Entity[],
) {
  const settings = await getSettings();
  const confLabel = (id: string) =>
    settings.confidenceTypes.find((c) => c.id === id)?.label ?? id;
  const sections = filterReportFields(
    entity.sections,
    settings.confidenceTypes,
    true,
  );

  return renderToBuffer(
    <Document>
      <Page size="A4" style={pdfStyles.page} wrap>
        <EntityPdfPages
          entity={entity}
          sections={sections}
          relationships={relationships}
          linked={linked}
          allEntities={linked}
          confLabel={confLabel}
          relationshipTypes={settings.relationshipTypes}
          confidenceTypes={settings.confidenceTypes}
        />
      </Page>
    </Document>,
  );
}
