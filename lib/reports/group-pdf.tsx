import React from "react";
import { Document, Page, Text, View, Image, renderToBuffer } from "@react-pdf/renderer";
import {
  EntityPdfPages,
  pdfStyles,
} from "@/lib/reports/pdf-blocks";
import { loadScopePdfImages } from "@/lib/reports/media";
import type { Case, Entity, Group, Relationship, Settings } from "@/lib/types";
import { filterReportFields } from "./shared";

function GroupPdfPages({
  group,
  linked,
  linkedCases,
  linkedGroups,
  scopedRels,
  allEntities,
  pdfImages,
}: {
  group: Group;
  linked: Entity[];
  linkedCases: Case[];
  linkedGroups: Group[];
  scopedRels: Relationship[];
  allEntities: Entity[];
  pdfImages?: Map<string, string>;
}) {
  return (
    <>
      <Text style={pdfStyles.title}>{group.title}</Text>
      <Text style={pdfStyles.meta}>
        Exported {new Date().toLocaleString()}
        {group.tags?.length ? ` · Tags: ${group.tags.join(", ")}` : ""}
      </Text>
      <Text style={pdfStyles.meta}>
        Created {group.createdAt.slice(0, 10)} · Updated{" "}
        {group.updatedAt.slice(0, 10)}
      </Text>
      {pdfImages?.get(`profile:group:${group.id}`) ? (
        <View>
          <Text style={pdfStyles.h3}>Profile image</Text>
          <Image
            style={pdfStyles.image}
            src={pdfImages.get(`profile:group:${group.id}`)!}
          />
        </View>
      ) : null}
      {group.description ? (
        <Text style={pdfStyles.body}>{group.description}</Text>
      ) : null}
      <Text style={pdfStyles.h2}>Linked cases</Text>
      {linkedCases.length === 0 ? (
        <Text>None</Text>
      ) : (
        linkedCases.map((c) => (
          <Text key={c.id} style={pdfStyles.bullet}>
            {c.title} ({c.status})
          </Text>
        ))
      )}
      <Text style={pdfStyles.h2}>Linked groups</Text>
      {linkedGroups.length === 0 ? (
        <Text>None</Text>
      ) : (
        linkedGroups.map((g) => (
          <Text key={g.id} style={pdfStyles.bullet}>
            {g.title}
          </Text>
        ))
      )}
      <Text style={pdfStyles.h2}>Linked entities</Text>
      {linked.map((e) => (
        <Text key={e.id} style={pdfStyles.bullet}>
          [{e.type}] {e.displayName}
        </Text>
      ))}
      <Text style={pdfStyles.h2}>Relationships</Text>
      {scopedRels.length === 0 ? (
        <Text>None in scope</Text>
      ) : (
        scopedRels.map((r) => {
          const from = allEntities.find((e) => e.id === r.fromEntityId);
          const to = allEntities.find((e) => e.id === r.toEntityId);
          return (
            <Text key={r.id} style={pdfStyles.bullet}>
              {from?.displayName} — {r.type} — {to?.displayName}
            </Text>
          );
        })
      )}
    </>
  );
}

export async function renderGroupReportPdf(input: {
  group: Group;
  linked: Entity[];
  linkedCases: Case[];
  linkedGroups: Group[];
  relationships: Relationship[];
  allEntities: Entity[];
  settings: Pick<Settings, "confidenceTypes" | "relationshipTypes">;
  pdfImages?: Map<string, string>;
}) {
  const confLabel = (id: string) =>
    input.settings.confidenceTypes.find((c) => c.id === id)?.label ?? id;

  const scopeIds = new Set(input.group.entityIds);
  const scopedRels = input.relationships.filter(
    (r) => scopeIds.has(r.fromEntityId) && scopeIds.has(r.toEntityId),
  );

  const pdfImages =
    input.pdfImages ??
    (await loadScopePdfImages({
      entities: input.linked,
      groupProfile: input.group.profileImage,
      groupId: input.group.id,
    }));

  return renderToBuffer(
    <Document>
      <Page size="A4" style={pdfStyles.page} wrap>
        <GroupPdfPages
          group={input.group}
          linked={input.linked}
          linkedCases={input.linkedCases}
          linkedGroups={input.linkedGroups}
          scopedRels={scopedRels}
          allEntities={input.allEntities}
          pdfImages={pdfImages}
        />
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
