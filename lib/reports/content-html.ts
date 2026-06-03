import {
  formatRelationshipForEntity,
  formatRelationshipForEntityWithMeta,
} from "@/lib/relationships/helpers";
import { formatProvenanceValidity } from "@/lib/date-range/format";
import { migrateProofItem } from "@/lib/date-range/migrate";
import { renderMarkdownToHtml } from "@/lib/markdown/render";
import { PROOF_KINDS } from "@/lib/types/proof";
import {
  mergeScopeTimelineEvents,
  type ScopedTimelineEvent,
} from "@/lib/investigation/stats";
import {
  contextEntryKindLabel,
  noteEntryKindLabel,
  resolveFieldDisplayValue,
  sortSectionsFields,
} from "@/lib/reports/render-shared";
import { renderTimelineReportHtml } from "@/lib/reports/timeline-html";
import {
  escHtml,
  fieldFootnote,
  filterReportFields,
} from "@/lib/reports/shared";
import type {
  Case,
  ConfidenceTypeDefinition,
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

function kindLabel<T extends string>(
  kinds: { id: T; label: string }[],
  id: T,
) {
  return kinds.find((k) => k.id === id)?.label ?? id;
}

function tagsHtml(tags?: string[]) {
  if (!tags?.length) return "";
  return tags.map((t) => `<span class="tag">${escHtml(t)}</span>`).join(" ");
}

async function markdownBlock(
  label: string,
  body: string | undefined,
  entities: Entity[],
  cases: Case[],
) {
  if (!body?.trim()) return "";
  const html = await renderMarkdownToHtml(body.trim(), {
    flavor: "obsidian",
    entities,
    cases,
  });
  return `<h4>${escHtml(label)}</h4><div class="desc markdown">${html}</div>`;
}

async function annotationsHtml(
  item: { description?: string; notes?: string; tags?: string[] },
  entities: Entity[],
  cases: Case[],
) {
  const parts: string[] = [];
  if (item.tags?.length) {
    parts.push(`<p class="muted">Tags: ${tagsHtml(item.tags)}</p>`);
  }
  parts.push(await markdownBlock("Description", item.description, entities, cases));
  parts.push(await markdownBlock("Notes", item.notes, entities, cases));
  return parts.filter(Boolean).join("");
}

async function renderProvenanceBlock(
  provenance: Provenance | undefined,
  confLabel: (id: string) => string,
  entities: Entity[],
  cases: Case[],
) {
  if (!provenance) return "";
  const parts: string[] = [];
  parts.push(
    `<p class="footnote"><strong>Confidence:</strong> ${escHtml(confLabel(provenance.confidence))}</p>`,
  );
  if (provenance.source) {
    parts.push(`<p class="muted">Source: ${escHtml(provenance.source)}</p>`);
  }
  if (provenance.sourceUrl) {
    parts.push(
      `<p class="muted">URL: <a href="${escHtml(provenance.sourceUrl)}">${escHtml(provenance.sourceUrl)}</a></p>`,
    );
  }
  if (provenance.collectedAt) {
    parts.push(
      `<p class="muted">Collected: ${escHtml(provenance.collectedAt.slice(0, 10))}</p>`,
    );
  }
  const validity = formatProvenanceValidity(provenance.validity);
  if (validity) {
    parts.push(`<p class="muted">Valid period: ${escHtml(validity)}</p>`);
  }
  parts.push(await annotationsHtml(provenance, entities, cases));
  const proofs = provenance.proofs ?? [];
  if (proofs.length) {
    const items = [...proofs]
      .sort((a, b) => a.order - b.order)
      .map((p) => renderProofItemHtml(p, confLabel))
      .join("");
    parts.push(`<h4>Evidence (${proofs.length})</h4><ul class="proof-list">${items}</ul>`);
  }
  return parts.join("");
}

function renderProofItemHtml(
  proof: ProofItem,
  confLabel: (id: string) => string,
) {
  const p = migrateProofItem(proof);
  const kind = kindLabel(PROOF_KINDS, p.kind);
  const lines = [
    `<strong>${escHtml(p.title)}</strong> (${escHtml(kind)}, ${escHtml(confLabel(p.confidence))})`,
  ];
  if (p.url) {
    lines.push(`<a href="${escHtml(p.url)}">${escHtml(p.url)}</a>`);
  }
  if (p.filename) lines.push(`File: ${escHtml(p.filename)}`);
  if (p.collectedAt) {
    lines.push(`Collected ${escHtml(p.collectedAt.slice(0, 10))}`);
  }
  const valid = formatProvenanceValidity(p.validity);
  if (valid) lines.push(`Valid: ${escHtml(valid)}`);
  if (p.excerpt) {
    lines.push(`<span class="muted">${escHtml(p.excerpt.slice(0, 500))}</span>`);
  }
  return `<li>${lines.join(" · ")}</li>`;
}

async function renderContextEntries(
  entries: ContextEntry[] | undefined,
  entities: Entity[],
  cases: Case[],
) {
  if (!entries?.length) return "";
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const blocks = await Promise.all(
    sorted.map(async (e) => {
      const kind = contextEntryKindLabel(e.kind);
      const body = e.body
        ? await renderMarkdownToHtml(e.body, {
            flavor: "obsidian",
            entities,
            cases,
          })
        : "";
      return `<div class="card">
        <h4>${escHtml(e.title)} <span class="muted">(${escHtml(kind)})</span></h4>
        ${tagsHtml(e.tags) ? `<p class="muted">Tags: ${tagsHtml(e.tags)}</p>` : ""}
        ${body ? `<div class="desc markdown">${body}</div>` : ""}
      </div>`;
    }),
  );
  return blocks.join("");
}

async function renderNoteEntries(
  entries: NoteEntry[] | undefined,
  entities: Entity[],
  cases: Case[],
) {
  if (!entries?.length) return "";
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const blocks = await Promise.all(
    sorted.map(async (e) => {
      const kind = noteEntryKindLabel(e.kind);
      const body = e.body
        ? await renderMarkdownToHtml(e.body, {
            flavor: "obsidian",
            entities,
            cases,
          })
        : "";
      return `<div class="card">
        <h4>${escHtml(e.title)} <span class="muted">(${escHtml(kind)})</span></h4>
        ${tagsHtml(e.tags) ? `<p class="muted">Tags: ${tagsHtml(e.tags)}</p>` : ""}
        ${body ? `<div class="desc markdown">${body}</div>` : ""}
      </div>`;
    }),
  );
  return blocks.join("");
}

function renderFieldHtml(
  field: Field,
  confLabel: (id: string) => string,
  allEntities: Entity[],
) {
  const value = resolveFieldDisplayValue(field, allEntities);
  const valuePeriod = formatProvenanceValidity(field.value.validity);
  const valueCell = valuePeriod
    ? `${escHtml(value || "—")}<br/><span class="muted">Value period: ${escHtml(valuePeriod)}</span>`
    : escHtml(value || "—");
  const foot = fieldFootnote(field, confLabel);
  return `<tr>
    <td>${escHtml(field.label)}</td>
    <td>${valueCell}</td>
    <td>${escHtml(foot)}</td>
  </tr>`;
}

export async function renderEntityReportBody(
  entity: Entity,
  relationships: Relationship[],
  linked: Entity[],
  settings: Pick<Settings, "confidenceTypes" | "relationshipTypes">,
  options?: {
    headingLevel?: "h2" | "h3";
    anchorPrefix?: string;
    allEntities?: Entity[];
    cases?: Case[];
  },
) {
  const h = options?.headingLevel ?? "h2";
  const prefix = options?.anchorPrefix ?? "";
  const allEntities = options?.allEntities ?? linked;
  const cases = options?.cases ?? [];
  const confLabel = (id: string) =>
    settings.confidenceTypes.find((c) => c.id === id)?.label ?? id;

  const sections = sortSectionsFields(
    filterReportFields(entity.sections, settings.confidenceTypes, true),
  );

  const rels = relationships.filter(
    (r) => r.fromEntityId === entity.id || r.toEntityId === entity.id,
  );

  const relRows = rels
    .map((r) => {
      const otherId =
        r.fromEntityId === entity.id ? r.toEntityId : r.fromEntityId;
      const other = linked.find((e) => e.id === otherId);
      return `<li>${escHtml(
        formatRelationshipForEntityWithMeta(
          entity.id,
          r,
          other,
          settings.relationshipTypes,
          settings.confidenceTypes,
        ),
      )}</li>`;
    })
    .join("");

  const sectionsHtml = await Promise.all(
    sections.map(async (sec) => {
      const fieldBlocks = await Promise.all(
        sec.fields.map(async (f) => {
          const row = renderFieldHtml(f, confLabel, allEntities);
          const prov = await renderProvenanceBlock(
            f.provenance,
            confLabel,
            allEntities,
            cases,
          );
          const provRow = prov ? `<tr><td colspan="3">${prov}</td></tr>` : "";
          return row + provRow;
        }),
      );
      return `<${h} id="${prefix}sec-${escHtml(sec.id)}">${escHtml(sec.title)}</${h}>
        <table><thead><tr><th>Field</th><th>Value</th><th>Provenance</th></tr></thead><tbody>${fieldBlocks.join("")}</tbody></table>`;
    }),
  );

  const galleryRows = [...entity.gallery]
    .sort((a, b) => a.order - b.order)
    .map(
      (img) =>
        `<tr>
          <td>${escHtml(img.caption ?? img.url ?? img.path ?? img.id)}</td>
          <td>${escHtml(img.source)}</td>
          <td>${escHtml(img.description ?? "")}</td>
          <td>${tagsHtml(img.tags)}</td>
        </tr>`,
    )
    .join("");

  const attachmentRows = (entity.attachments ?? [])
    .map(
      (a) =>
        `<tr>
          <td>${escHtml(a.filename)}</td>
          <td>${escHtml(a.mimeType)}</td>
          <td class="mono">${escHtml(a.sha256)}</td>
          <td>${escHtml(a.description ?? "")}</td>
        </tr>`,
    )
    .join("");

  const timelineHtml = renderTimelineReportHtml(entity.events, {
    title: "Timeline",
  });

  const entityProv = await renderProvenanceBlock(
    entity.provenance,
    confLabel,
    allEntities,
    cases,
  );

  const contextHtml = await renderContextEntries(
    entity.contextEntries,
    allEntities,
    cases,
  );
  const notesHtml = await renderNoteEntries(
    entity.noteEntries,
    allEntities,
    cases,
  );

  return `
  <${h} id="${prefix}entity-${escHtml(entity.id)}">${escHtml(entity.displayName)}</${h}>
  <p class="meta">Type: ${escHtml(entity.type)}
    ${entity.slug ? ` · Slug: ${escHtml(entity.slug)}` : ""}
    ${entity.aliases?.length ? ` · Aliases: ${escHtml(entity.aliases.join(", "))}` : ""}
  </p>
  ${entity.tags?.length ? `<p class="meta">Tags: ${tagsHtml(entity.tags)}</p>` : ""}
  ${entityProv ? `<h4>Entity-level provenance</h4>${entityProv}` : ""}
  ${contextHtml ? `<h4>Context</h4>${contextHtml}` : ""}
  ${notesHtml ? `<h4>Notes</h4>${notesHtml}` : ""}
  <h4>Sections</h4>
  ${sectionsHtml.join("") || '<p class="muted">No sections (debunked fields omitted).</p>'}
  <h4>Relationships</h4>
  ${rels.length ? `<ul>${relRows}</ul>` : '<p class="muted">None</p>'}
  ${timelineHtml}
  <h4>Gallery</h4>
  ${galleryRows ? `<table><thead><tr><th>Caption</th><th>Source</th><th>Description</th><th>Tags</th></tr></thead><tbody>${galleryRows}</tbody></table>` : '<p class="muted">None</p>'}
  <h4>Attachments</h4>
  ${attachmentRows ? `<table><thead><tr><th>File</th><th>Type</th><th>SHA-256</th><th>Description</th></tr></thead><tbody>${attachmentRows}</tbody></table>` : '<p class="muted">None</p>'}
  `;
}

export async function renderCaseReportBody(input: {
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
  const {
    caseData,
    linked,
    linkedCases,
    relationships,
    tools,
    resources,
    playbooks,
    allEntities,
    settings,
  } = input;

  const scopeIds = new Set(caseData.entityIds);
  const scopedRels = relationships.filter(
    (r) => scopeIds.has(r.fromEntityId) && scopeIds.has(r.toEntityId),
  );

  const relRows = scopedRels
    .map((r) => {
      const from = allEntities.find((e) => e.id === r.fromEntityId);
      const to = allEntities.find((e) => e.id === r.toEntityId);
      const label = formatRelationshipForEntity(
        r.fromEntityId,
        r,
        to,
        settings.relationshipTypes,
      );
      return `<tr>
        <td>${escHtml(from?.displayName ?? r.fromEntityId)}</td>
        <td>${escHtml(label)}</td>
        <td>${escHtml(to?.displayName ?? r.toEntityId)}</td>
      </tr>`;
    })
    .join("");

  const entitySummaryRows = linked
    .map(
      (e) =>
        `<tr>
          <td>${escHtml(e.type)}</td>
          <td>${escHtml(e.displayName)}</td>
          <td>${escHtml(e.tags?.join(", ") ?? "")}</td>
          <td>${e.sections.reduce((n, s) => n + s.fields.length, 0)}</td>
        </tr>`,
    )
    .join("");

  const linkedCaseRows = linkedCases
    .map(
      (c) =>
        `<tr>
          <td>${escHtml(c.title)}</td>
          <td>${escHtml(c.status)}</td>
          <td>${c.entityIds.length}</td>
          <td>${escHtml(c.tags?.join(", ") ?? "")}</td>
        </tr>`,
    )
    .join("");

  const caseTools = tools.filter((t) =>
    (caseData.toolIds ?? []).includes(t.id),
  );
  const caseResources = resources.filter((r) =>
    (caseData.resourceIds ?? []).includes(r.id),
  );

  const toolRows = caseTools
    .map(
      (t) =>
        `<tr><td>${escHtml(t.name)}</td><td>${escHtml(t.category ?? "")}</td><td>${escHtml(t.url ?? t.description ?? "")}</td></tr>`,
    )
    .join("");

  const resourceRows = caseResources
    .map(
      (r) =>
        `<tr><td>${escHtml(r.name)}</td><td>${escHtml(r.category ?? "")}</td><td>${escHtml(r.url ?? r.description ?? "")}</td></tr>`,
    )
    .join("");

  const playbookBlocks = (caseData.playbookIds ?? [])
    .map((pid) => {
      const pb = playbooks.find((p) => p.id === pid);
      if (!pb) return "";
      const progress = caseData.playbookProgress.find(
        (p) => p.playbookId === pid,
      );
      const done = new Set(progress?.completedStepIds ?? []);
      const steps = [...pb.steps]
        .sort((a, b) => a.order - b.order)
        .map(
          (s) =>
            `<li>${done.has(s.id) ? "☑" : "☐"} ${escHtml(s.title)}${s.description ? ` — <span class="muted">${escHtml(s.description)}</span>` : ""}</li>`,
        )
        .join("");
      return `<div class="card"><h3>${escHtml(pb.title)}</h3><ul>${steps}</ul></div>`;
    })
    .join("");

  const timelineEvents = mergeScopeTimelineEvents(caseData.events, linked);
  const timelineHtml = renderTimelineReportHtml(timelineEvents, {
    title: "Timeline (case + entities)",
    sourceLabel: (ev: ScopedTimelineEvent) =>
      ev.source === "case" ? "Case" : (ev.sourceLabel ?? "Entity"),
  });

  const entityBodies = (
    await Promise.all(
      linked.map((e) =>
        renderEntityReportBody(e, relationships, allEntities, settings, {
          headingLevel: "h3",
          anchorPrefix: `e-${e.id}-`,
          allEntities,
          cases: linkedCases.concat(caseData),
        }),
      ),
    )
  ).join(
    '<hr style="margin:2rem 0;border:none;border-top:1px solid #e4e4e7"/>',
  );

  const descriptionHtml = caseData.description
    ? await renderMarkdownToHtml(caseData.description, {
        flavor: "obsidian",
        entities: allEntities,
        cases: linkedCases.concat(caseData),
      })
    : "";

  const toc = `
  <nav class="toc" aria-label="Table of contents">
    <strong>Contents</strong>
    <ul>
      <li><a href="#summary">Summary</a></li>
      <li><a href="#description">Description</a></li>
      <li><a href="#linked-cases">Linked cases</a></li>
      <li><a href="#entities">Linked entities</a></li>
      <li><a href="#relationships">Relationships</a></li>
      <li><a href="#timeline">Timeline</a></li>
      <li><a href="#tools">Tools</a></li>
      <li><a href="#resources">Resources</a></li>
      <li><a href="#playbooks">Playbooks</a></li>
      <li><a href="#entity-details">Entity details</a></li>
    </ul>
  </nav>`;

  return `
  ${toc}
  <h2 id="summary">Summary</h2>
  <p class="meta">Status: <strong>${escHtml(caseData.status)}</strong></p>
  <p class="meta">Created ${escHtml(caseData.createdAt.slice(0, 10))} · Updated ${escHtml(caseData.updatedAt.slice(0, 10))}</p>
  ${caseData.tags?.length ? `<p class="meta">Tags: ${tagsHtml(caseData.tags)}</p>` : ""}
  <p class="meta">${linked.length} linked entities · ${linkedCases.length} linked cases · ${scopedRels.length} relationships in scope</p>

  <h2 id="description">Description</h2>
  ${descriptionHtml ? `<div class="desc markdown">${descriptionHtml}</div>` : '<p class="muted">No description.</p>'}

  <h2 id="linked-cases">Linked cases</h2>
  ${linkedCaseRows ? `<table><thead><tr><th>Title</th><th>Status</th><th>Entities</th><th>Tags</th></tr></thead><tbody>${linkedCaseRows}</tbody></table>` : '<p class="muted">None</p>'}

  <h2 id="entities">Linked entities</h2>
  ${entitySummaryRows ? `<table><thead><tr><th>Type</th><th>Name</th><th>Tags</th><th>Fields</th></tr></thead><tbody>${entitySummaryRows}</tbody></table>` : '<p class="muted">None</p>'}

  <h2 id="relationships">Relationships (within case scope)</h2>
  ${relRows ? `<table><thead><tr><th>From</th><th>Relationship</th><th>To</th></tr></thead><tbody>${relRows}</tbody></table>` : '<p class="muted">None</p>'}

  <div id="timeline">${timelineHtml}</div>

  <h2 id="tools">Tools</h2>
  ${toolRows ? `<table><thead><tr><th>Name</th><th>Category</th><th>URL / notes</th></tr></thead><tbody>${toolRows}</tbody></table>` : '<p class="muted">None</p>'}

  <h2 id="resources">Resources</h2>
  ${resourceRows ? `<table><thead><tr><th>Name</th><th>Category</th><th>URL / notes</th></tr></thead><tbody>${resourceRows}</tbody></table>` : '<p class="muted">None</p>'}

  <h2 id="playbooks">Playbooks</h2>
  ${playbookBlocks || '<p class="muted">None attached</p>'}

  <h2 id="entity-details">Entity details</h2>
  ${entityBodies || '<p class="muted">No linked entities.</p>'}
  `;
}
