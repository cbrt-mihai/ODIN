import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatProvenanceValidity } from "@/lib/date-range/format";
import { migrateProofItem } from "@/lib/date-range/migrate";
import { formatRelationshipForEntityWithMeta } from "@/lib/relationships/helpers";
import {
  contextEntryKindLabel,
  noteEntryKindLabel,
  resolveFieldDisplayValue,
  sortSectionsFields,
} from "@/lib/reports/render-shared";
import { fieldFootnote } from "@/lib/reports/shared";
import type {
  Case,
  ContextEntry,
  Entity,
  Field,
  NoteEntry,
  Playbook,
  Provenance,
  ProofItem,
  Relationship,
  Resource,
  Settings,
  Tool,
} from "@/lib/types";

export const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", lineHeight: 1.35 },
  title: { fontSize: 16, marginBottom: 6, fontWeight: "bold" },
  meta: { fontSize: 8, color: "#666", marginBottom: 12 },
  h2: { fontSize: 11, marginTop: 12, marginBottom: 5, fontWeight: "bold" },
  h3: { fontSize: 10, marginTop: 8, marginBottom: 4, fontWeight: "bold" },
  body: { marginBottom: 4 },
  footnote: { fontSize: 7, color: "#888", marginBottom: 4 },
  bullet: { marginLeft: 8, marginBottom: 2 },
});

function ProvenancePdf({
  provenance,
  confLabel,
}: {
  provenance?: Provenance;
  confLabel: (id: string) => string;
}) {
  if (!provenance) return null;
  const validity = formatProvenanceValidity(provenance.validity);
  return (
    <View style={{ marginTop: 2, marginBottom: 4 }}>
      <Text style={pdfStyles.footnote}>
        Confidence: {confLabel(provenance.confidence)}
        {provenance.source ? ` · Source: ${provenance.source}` : ""}
        {validity ? ` · Valid: ${validity}` : ""}
      </Text>
      {(provenance.proofs ?? []).map((p) => (
        <ProofPdf key={p.id} proof={p} confLabel={confLabel} />
      ))}
    </View>
  );
}

function ProofPdf({
  proof,
  confLabel,
}: {
  proof: ProofItem;
  confLabel: (id: string) => string;
}) {
  const p = migrateProofItem(proof);
  const valid = formatProvenanceValidity(p.validity);
  return (
    <Text style={pdfStyles.bullet}>
      • {p.title} ({p.kind}, {confLabel(p.confidence)})
      {p.url ? ` — ${p.url}` : ""}
      {valid ? ` · Valid: ${valid}` : ""}
      {p.excerpt ? ` — ${p.excerpt}` : ""}
    </Text>
  );
}

function FieldPdf({
  field,
  confLabel,
  allEntities,
}: {
  field: Field;
  confLabel: (id: string) => string;
  allEntities: Entity[];
}) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={pdfStyles.body}>
        <Text style={{ fontWeight: "bold" }}>{field.label}: </Text>
        {resolveFieldDisplayValue(field, allEntities) || "—"}
      </Text>
      <Text style={pdfStyles.footnote}>{fieldFootnote(field, confLabel)}</Text>
      <ProvenancePdf provenance={field.provenance} confLabel={confLabel} />
    </View>
  );
}

function EntryListPdf({
  title,
  entries,
  kindLabel,
}: {
  title: string;
  entries: (ContextEntry | NoteEntry)[];
  kindLabel: (kind: string) => string;
}) {
  if (!entries?.length) return null;
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  return (
    <View>
      <Text style={pdfStyles.h3}>{title}</Text>
      {sorted.map((e) => (
        <View key={e.id} style={{ marginBottom: 6 }}>
          <Text style={pdfStyles.body}>
            {e.title} ({kindLabel(e.kind)})
          </Text>
          {e.body ? (
            <Text style={pdfStyles.footnote}>{e.body}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function EntityPdfPages({
  entity,
  sections,
  relationships,
  linked,
  allEntities,
  confLabel,
  relationshipTypes,
  confidenceTypes,
}: {
  entity: Entity;
  sections: Entity["sections"];
  relationships: Relationship[];
  linked: Entity[];
  allEntities: Entity[];
  confLabel: (id: string) => string;
  relationshipTypes: Settings["relationshipTypes"];
  confidenceTypes: Settings["confidenceTypes"];
}) {
  const rels = relationships.filter(
    (r) => r.fromEntityId === entity.id || r.toEntityId === entity.id,
  );
  const sortedSections = sortSectionsFields(sections);

  return (
    <>
      <Text style={pdfStyles.title}>{entity.displayName}</Text>
      <Text style={pdfStyles.meta}>
        Type: {entity.type} · Exported {new Date().toLocaleString()}
        {entity.tags?.length ? ` · Tags: ${entity.tags.join(", ")}` : ""}
      </Text>
      <ProvenancePdf provenance={entity.provenance} confLabel={confLabel} />
      <EntryListPdf
        title="Context"
        entries={entity.contextEntries ?? []}
        kindLabel={contextEntryKindLabel}
      />
      <EntryListPdf
        title="Notes"
        entries={entity.noteEntries ?? []}
        kindLabel={noteEntryKindLabel}
      />
      <Text style={pdfStyles.h2}>Sections</Text>
      {sortedSections.length === 0 ? (
        <Text>No sections (debunked fields omitted).</Text>
      ) : (
        sortedSections.map((sec) => (
          <View key={sec.id}>
            <Text style={pdfStyles.h3}>{sec.title}</Text>
            {sec.fields.map((f) => (
              <FieldPdf
                key={f.id}
                field={f}
                confLabel={confLabel}
                allEntities={allEntities}
              />
            ))}
          </View>
        ))
      )}
      <Text style={pdfStyles.h2}>Relationships</Text>
      {rels.length === 0 ? (
        <Text>None</Text>
      ) : (
        rels.map((r) => {
          const otherId =
            r.fromEntityId === entity.id ? r.toEntityId : r.fromEntityId;
          const other = linked.find((e) => e.id === otherId);
          return (
            <Text key={r.id} style={pdfStyles.bullet}>
              {formatRelationshipForEntityWithMeta(
                entity.id,
                r,
                other,
                relationshipTypes,
                confidenceTypes,
              )}
            </Text>
          );
        })
      )}
      <Text style={pdfStyles.h2}>Timeline</Text>
      {entity.events.length === 0 ? (
        <Text>None</Text>
      ) : (
        [...entity.events]
          .sort(
            (a, b) =>
              new Date(a.occurredAt).getTime() -
              new Date(b.occurredAt).getTime(),
          )
          .map((ev) => (
            <Text key={ev.id} style={pdfStyles.bullet}>
              {ev.occurredAt.slice(0, 16)} — {ev.title}
              {ev.endAt ? ` → ${ev.endAt.slice(0, 16)}` : ""}
              {ev.type ? ` (${ev.type})` : ""}
              {ev.description ? ` — ${ev.description}` : ""}
            </Text>
          ))
      )}
      <Text style={pdfStyles.h2}>Gallery & attachments</Text>
      <Text style={pdfStyles.body}>
        Gallery: {entity.gallery.length} image(s) · Attachments:{" "}
        {(entity.attachments ?? []).length} file(s)
      </Text>
      {(entity.attachments ?? []).map((a) => (
        <Text key={a.id} style={pdfStyles.bullet}>
          {a.filename} ({a.mimeType}) — {a.sha256}
        </Text>
      ))}
    </>
  );
}

export function CasePdfPages({
  caseData,
  linked,
  linkedCases,
  scopedRels,
  allEntities,
  confLabel,
  relationshipTypes,
  confidenceTypes,
  playbooks,
  tools,
  resources,
}: {
  caseData: Case;
  linked: Entity[];
  linkedCases: Case[];
  scopedRels: Relationship[];
  allEntities: Entity[];
  confLabel: (id: string) => string;
  relationshipTypes: Settings["relationshipTypes"];
  confidenceTypes: Settings["confidenceTypes"];
  playbooks: Playbook[];
  tools: Tool[];
  resources: Resource[];
}) {
  const caseTools = tools.filter((t) =>
    (caseData.toolIds ?? []).includes(t.id),
  );
  const caseResources = resources.filter((r) =>
    (caseData.resourceIds ?? []).includes(r.id),
  );

  return (
    <>
      <Text style={pdfStyles.title}>{caseData.title}</Text>
      <Text style={pdfStyles.meta}>
        Status: {caseData.status} · Exported {new Date().toLocaleString()}
        {caseData.tags?.length ? ` · Tags: ${caseData.tags.join(", ")}` : ""}
      </Text>
      <Text style={pdfStyles.meta}>
        Created {caseData.createdAt.slice(0, 10)} · Updated{" "}
        {caseData.updatedAt.slice(0, 10)}
      </Text>
      {caseData.description ? (
        <Text style={pdfStyles.body}>{caseData.description}</Text>
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
              {from?.displayName} —{" "}
              {formatRelationshipForEntityWithMeta(
                r.fromEntityId,
                r,
                to,
                relationshipTypes,
                confidenceTypes,
              )}{" "}
              — {to?.displayName}
            </Text>
          );
        })
      )}
      <Text style={pdfStyles.h2}>Tools</Text>
      {caseTools.length === 0 ? (
        <Text>None</Text>
      ) : (
        caseTools.map((t) => (
          <Text key={t.id} style={pdfStyles.bullet}>
            {t.name}
            {t.category ? ` (${t.category})` : ""}
            {t.url ? ` — ${t.url}` : t.description ? ` — ${t.description}` : ""}
          </Text>
        ))
      )}
      <Text style={pdfStyles.h2}>Resources</Text>
      {caseResources.length === 0 ? (
        <Text>None</Text>
      ) : (
        caseResources.map((r) => (
          <Text key={r.id} style={pdfStyles.bullet}>
            {r.name}
            {r.category ? ` (${r.category})` : ""}
            {r.url ? ` — ${r.url}` : r.description ? ` — ${r.description}` : ""}
          </Text>
        ))
      )}
      <Text style={pdfStyles.h2}>Playbooks</Text>
      {(caseData.playbookIds ?? []).length === 0 ? (
        <Text>None attached</Text>
      ) : (
        (caseData.playbookIds ?? []).map((pid) => {
          const pb = playbooks.find((p) => p.id === pid);
          if (!pb) return null;
          const progress = caseData.playbookProgress.find(
            (p) => p.playbookId === pid,
          );
          const done = new Set(progress?.completedStepIds ?? []);
          return (
            <View key={pid}>
              <Text style={pdfStyles.h3}>{pb.title}</Text>
              {[...pb.steps]
                .sort((a, b) => a.order - b.order)
                .map((s) => (
                  <Text key={s.id} style={pdfStyles.bullet}>
                    {done.has(s.id) ? "[x]" : "[ ]"} {s.title}
                    {s.description ? ` — ${s.description}` : ""}
                  </Text>
                ))}
            </View>
          );
        })
      )}
    </>
  );
}
