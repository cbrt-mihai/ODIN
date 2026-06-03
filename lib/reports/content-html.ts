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
import {
  buildFolderRelSegments,
  entityAttachmentZipPath,
  entityProfileZipPath,
  galleryItemLabel,
  galleryPreviewKind,
  resolveGalleryImageSrc,
  resolveProfileImageSrc,
  resolveReportMediaSrc,
  scopeProfileZipPath,
  type ReportMediaContext,
} from "@/lib/reports/media";
import { renderTimelineReportHtml } from "@/lib/reports/timeline-html";
import {
  caseEntitySourceLabel,
  groupEntitySourceLabel,
} from "@/lib/reports/scope";
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
  Group,
  NoteEntry,
  Playbook,
  Provenance,
  ProofItem,
  Relationship,
  Resource,
  Settings,
  Tool,
} from "@/lib/types";

const DEFAULT_MEDIA_CTX: ReportMediaContext = { mode: "embed" };

async function renderProfileImageHtml(
  ctx: ReportMediaContext,
  profile: Entity["profileImage"] | Case["profileImage"] | Group["profileImage"],
  relativePath: string,
  alt: string,
) {
  const src = await resolveProfileImageSrc(ctx, profile, relativePath);
  if (!src) return "";
  return `<figure><img class="profile-image" src="${escHtml(src)}" alt="${escHtml(alt)}" /></figure>`;
}

async function renderGalleryHtml(
  ctx: ReportMediaContext,
  entity: Entity,
) {
  const sorted = [...entity.gallery].sort((a, b) => a.order - b.order);
  if (!sorted.length) return '<p class="muted">None</p>';

  const items = await Promise.all(
    sorted.map(async (img) => {
      const src = await resolveGalleryImageSrc(ctx, entity, img);
      const label = galleryItemLabel(img);
      const kind = galleryPreviewKind(img);
      const folderPath = buildFolderRelSegments(
        entity.galleryFolders ?? [],
        img.folderId,
      );
      const folderLabel = folderPath.length
        ? `<p class="muted">Folder: ${escHtml(folderPath.join(" / "))}</p>`
        : "";
      const meta = [
        img.source === "url" ? "URL" : "Upload",
        img.mimeType ? escHtml(img.mimeType) : "",
        img.sha256 ? `<span class="mono">${escHtml(img.sha256)}</span>` : "",
      ]
        .filter(Boolean)
        .join(" · ");

      let media = "";
      if (src && kind === "image") {
        media = `<img src="${escHtml(src)}" alt="${escHtml(label)}" />`;
      } else if (src && kind === "video") {
        media = `<video src="${escHtml(src)}" controls preload="metadata"></video>`;
      } else if (src && kind === "audio") {
        media = `<audio src="${escHtml(src)}" controls preload="metadata"></audio>`;
      } else if (src) {
        media = `<p><a href="${escHtml(src)}">${escHtml(label)}</a></p>`;
      } else {
        media = `<p class="muted">${escHtml(label)} (no preview)</p>`;
      }

      return `<figure class="gallery-item">
        ${media}
        <figcaption>
          <strong>${escHtml(label)}</strong>
          ${folderLabel}
          ${img.description ? `<p>${escHtml(img.description)}</p>` : ""}
          ${tagsHtml(img.tags) ? `<p class="muted">Tags: ${tagsHtml(img.tags)}</p>` : ""}
          <p class="muted">${meta}</p>
        </figcaption>
      </figure>`;
    }),
  );

  return `<div class="gallery-grid">${items.join("")}</div>`;
}

async function renderAttachmentsHtml(
  ctx: ReportMediaContext,
  entity: Entity,
) {
  const attachments = entity.attachments ?? [];
  if (!attachments.length) return '<p class="muted">None</p>';

  const rows = await Promise.all(
    attachments.map(async (a) => {
      const href = await resolveReportMediaSrc(
        ctx,
        a,
        entityAttachmentZipPath(entity, a, ctx.mediaRoot ?? "media"),
      );
      const folderPath = buildFolderRelSegments(
        entity.attachmentFolders ?? [],
        a.folderId,
      );
      const folderCell = folderPath.length
        ? escHtml(folderPath.join(" / "))
        : "—";
      const fileCell = href
        ? `<a href="${escHtml(href)}">${escHtml(a.filename)}</a>`
        : escHtml(a.filename);
      return `<tr>
        <td>${fileCell}</td>
        <td>${folderCell}</td>
        <td>${escHtml(a.mimeType)}</td>
        <td class="mono">${escHtml(a.sha256)}</td>
        <td>${escHtml(a.description ?? "")}</td>
      </tr>`;
    }),
  );

  return `<table><thead><tr><th>File</th><th>Folder</th><th>Type</th><th>SHA-256</th><th>Description</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

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

function renderToolRows(caseData: Case, tools: Tool[]) {
  return tools
    .filter((t) => (caseData.toolIds ?? []).includes(t.id))
    .map(
      (t) =>
        `<tr><td>${escHtml(t.name)}</td><td>${escHtml(t.category ?? "")}</td><td>${escHtml(t.url ?? t.description ?? "")}</td></tr>`,
    )
    .join("");
}

function renderResourceRows(caseData: Case, resources: Resource[]) {
  return resources
    .filter((r) => (caseData.resourceIds ?? []).includes(r.id))
    .map(
      (r) =>
        `<tr><td>${escHtml(r.name)}</td><td>${escHtml(r.category ?? "")}</td><td>${escHtml(r.url ?? r.description ?? "")}</td></tr>`,
    )
    .join("");
}

function renderPlaybookBlocks(caseData: Case, playbooks: Playbook[]) {
  return (caseData.playbookIds ?? [])
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
      return `<div class="card"><h4>${escHtml(pb.title)}</h4><ul>${steps}</ul></div>`;
    })
    .join("");
}

function renderEntitySummaryRows(
  entities: Entity[],
  sourceLabel?: (entityId: string) => string,
) {
  return entities
    .map((e) => {
      const sourceCell = sourceLabel
        ? `<td>${escHtml(sourceLabel(e.id))}</td>`
        : "";
      return `<tr>
          <td>${escHtml(e.type)}</td>
          <td>${escHtml(e.displayName)}</td>
          <td>${escHtml(e.tags?.join(", ") ?? "")}</td>
          <td>${e.sections.reduce((n, s) => n + s.fields.length, 0)}</td>
          ${sourceCell}
        </tr>`;
    })
    .join("");
}

async function renderLinkedCaseDetailHtml(input: {
  caseData: Case;
  allEntities: Entity[];
  allCases: Case[];
  tools: Tool[];
  resources: Resource[];
  playbooks: Playbook[];
  settings: Pick<Settings, "confidenceTypes" | "relationshipTypes">;
  mediaCtx: ReportMediaContext;
  anchorId: string;
}) {
  const {
    caseData,
    allEntities,
    allCases,
    tools,
    resources,
    playbooks,
    mediaCtx,
    anchorId,
  } = input;

  const caseEntities = allEntities.filter((e) =>
    caseData.entityIds.includes(e.id),
  );
  const descriptionHtml = caseData.description
    ? await renderMarkdownToHtml(caseData.description, {
        flavor: "obsidian",
        entities: allEntities,
        cases: allCases,
      })
    : "";
  const profileHtml = caseData.profileImage
    ? await renderProfileImageHtml(
        mediaCtx,
        caseData.profileImage,
        scopeProfileZipPath(
          "case",
          caseData.title,
          caseData.id,
          caseData.profileImage,
          mediaCtx.mediaRoot ?? "media",
        ),
        caseData.title,
      )
    : "";
  const timelineHtml = renderTimelineReportHtml(
    mergeScopeTimelineEvents(caseData.events, caseEntities),
    {
      title: "Timeline",
      sourceLabel: (ev: ScopedTimelineEvent) =>
        ev.source === "case" ? "Case" : (ev.sourceLabel ?? "Entity"),
    },
  );
  const toolRows = renderToolRows(caseData, tools);
  const resourceRows = renderResourceRows(caseData, resources);
  const playbookBlocks = renderPlaybookBlocks(caseData, playbooks);
  const entityRows = renderEntitySummaryRows(caseEntities);

  return `<div class="card" id="${escHtml(anchorId)}">
    <h3>${escHtml(caseData.title)}</h3>
    <p class="meta">Status: <strong>${escHtml(caseData.status)}</strong></p>
    <p class="meta">Created ${escHtml(caseData.createdAt.slice(0, 10))} · Updated ${escHtml(caseData.updatedAt.slice(0, 10))}</p>
    ${caseData.tags?.length ? `<p class="meta">Tags: ${tagsHtml(caseData.tags)}</p>` : ""}
    ${profileHtml ? `<h4>Profile image</h4>${profileHtml}` : ""}
    <h4>Description</h4>
    ${descriptionHtml ? `<div class="desc markdown">${descriptionHtml}</div>` : '<p class="muted">No description.</p>'}
    ${timelineHtml}
    <h4>Tools</h4>
    ${toolRows ? `<table><thead><tr><th>Name</th><th>Category</th><th>URL / notes</th></tr></thead><tbody>${toolRows}</tbody></table>` : '<p class="muted">None</p>'}
    <h4>Resources</h4>
    ${resourceRows ? `<table><thead><tr><th>Name</th><th>Category</th><th>URL / notes</th></tr></thead><tbody>${resourceRows}</tbody></table>` : '<p class="muted">None</p>'}
    <h4>Playbooks</h4>
    ${playbookBlocks || '<p class="muted">None attached</p>'}
    <h4>Linked entities</h4>
    ${entityRows ? `<table><thead><tr><th>Type</th><th>Name</th><th>Tags</th><th>Fields</th></tr></thead><tbody>${entityRows}</tbody></table>` : '<p class="muted">None</p>'}
  </div>`;
}

async function renderLinkedGroupDetailHtml(input: {
  group: Group;
  allEntities: Entity[];
  allCases: Case[];
  mediaCtx: ReportMediaContext;
  anchorId: string;
}) {
  const { group, allEntities, allCases, mediaCtx, anchorId } = input;
  const groupEntities = allEntities.filter((e) =>
    group.entityIds.includes(e.id),
  );
  const descriptionHtml = group.description
    ? await renderMarkdownToHtml(group.description, {
        flavor: "obsidian",
        entities: allEntities,
        cases: allCases,
      })
    : "";
  const profileHtml = group.profileImage
    ? await renderProfileImageHtml(
        mediaCtx,
        group.profileImage,
        scopeProfileZipPath(
          "group",
          group.title,
          group.id,
          group.profileImage,
          mediaCtx.mediaRoot ?? "media",
        ),
        group.title,
      )
    : "";
  const timelineHtml = renderTimelineReportHtml(
    mergeScopeTimelineEvents([], groupEntities),
    {
      title: "Timeline (group members)",
      sourceLabel: (ev: ScopedTimelineEvent) => ev.sourceLabel ?? "Entity",
    },
  );
  const entityRows = renderEntitySummaryRows(groupEntities);

  return `<div class="card" id="${escHtml(anchorId)}">
    <h3>${escHtml(group.title)}</h3>
    <p class="meta">Created ${escHtml(group.createdAt.slice(0, 10))} · Updated ${escHtml(group.updatedAt.slice(0, 10))}</p>
    ${group.tags?.length ? `<p class="meta">Tags: ${tagsHtml(group.tags)}</p>` : ""}
    ${profileHtml ? `<h4>Profile image</h4>${profileHtml}` : ""}
    <h4>Description</h4>
    ${descriptionHtml ? `<div class="desc markdown">${descriptionHtml}</div>` : '<p class="muted">No description.</p>'}
    ${timelineHtml}
    <h4>Member entities</h4>
    ${entityRows ? `<table><thead><tr><th>Type</th><th>Name</th><th>Tags</th><th>Fields</th></tr></thead><tbody>${entityRows}</tbody></table>` : '<p class="muted">None</p>'}
  </div>`;
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
    mediaCtx?: ReportMediaContext;
  },
) {
  const h = options?.headingLevel ?? "h2";
  const prefix = options?.anchorPrefix ?? "";
  const allEntities = options?.allEntities ?? linked;
  const cases = options?.cases ?? [];
  const mediaCtx = options?.mediaCtx ?? DEFAULT_MEDIA_CTX;
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

  const profileHtml = entity.profileImage
    ? await renderProfileImageHtml(
        mediaCtx,
        entity.profileImage,
        entityProfileZipPath(
          entity,
          entity.profileImage,
          mediaCtx.mediaRoot ?? "media",
        ),
        entity.displayName,
      )
    : "";

  const galleryHtml = await renderGalleryHtml(mediaCtx, entity);
  const attachmentsHtml = await renderAttachmentsHtml(mediaCtx, entity);

  return `
  <${h} id="${prefix}entity-${escHtml(entity.id)}">${escHtml(entity.displayName)}</${h}>
  <p class="meta">Type: ${escHtml(entity.type)}
    ${entity.slug ? ` · Slug: ${escHtml(entity.slug)}` : ""}
    ${entity.aliases?.length ? ` · Aliases: ${escHtml(entity.aliases.join(", "))}` : ""}
  </p>
  ${entity.tags?.length ? `<p class="meta">Tags: ${tagsHtml(entity.tags)}</p>` : ""}
  ${profileHtml ? `<h4>Profile image</h4>${profileHtml}` : ""}
  ${entityProv ? `<h4>Entity-level provenance</h4>${entityProv}` : ""}
  ${contextHtml ? `<h4>Context</h4>${contextHtml}` : ""}
  ${notesHtml ? `<h4>Notes</h4>${notesHtml}` : ""}
  <h4>Sections</h4>
  ${sectionsHtml.join("") || '<p class="muted">No sections (debunked fields omitted).</p>'}
  <h4>Relationships</h4>
  ${rels.length ? `<ul>${relRows}</ul>` : '<p class="muted">None</p>'}
  ${timelineHtml}
  <h4>Gallery</h4>
  ${galleryHtml}
  <h4>Attachments</h4>
  ${attachmentsHtml}
  `;
}

export async function renderCaseReportBody(input: {
  caseData: Case;
  linked: Entity[];
  linkedCases: Case[];
  linkedGroups: Group[];
  relationships: Relationship[];
  tools: Tool[];
  resources: Resource[];
  playbooks: Playbook[];
  allEntities: Entity[];
  settings: Pick<Settings, "confidenceTypes" | "relationshipTypes">;
  mediaCtx?: ReportMediaContext;
}) {
  const {
    caseData,
    linked,
    linkedCases,
    linkedGroups,
    relationships,
    tools,
    resources,
    playbooks,
    allEntities,
    settings,
    mediaCtx = DEFAULT_MEDIA_CTX,
  } = input;

  const scopeIds = new Set(linked.map((e) => e.id));
  const scopedRels = relationships.filter(
    (r) => scopeIds.has(r.fromEntityId) && scopeIds.has(r.toEntityId),
  );
  const entitySource = (entityId: string) =>
    caseEntitySourceLabel(entityId, caseData, linkedCases, linkedGroups);
  const allCases = linkedCases.concat(caseData);

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

  const entitySummaryRows = renderEntitySummaryRows(linked, entitySource);

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

  const linkedGroupRows = linkedGroups
    .map(
      (g) =>
        `<tr>
          <td>${escHtml(g.title)}</td>
          <td>${g.entityIds.length}</td>
          <td>${escHtml(g.tags?.join(", ") ?? "")}</td>
        </tr>`,
    )
    .join("");

  const toolRows = renderToolRows(caseData, tools);
  const resourceRows = renderResourceRows(caseData, resources);
  const playbookBlocks = renderPlaybookBlocks(caseData, playbooks);

  const timelineEvents = mergeScopeTimelineEvents(caseData.events, linked);
  const timelineHtml = renderTimelineReportHtml(timelineEvents, {
    title: "Timeline (case + entities)",
    sourceLabel: (ev: ScopedTimelineEvent) =>
      ev.source === "case" ? "Case" : (ev.sourceLabel ?? "Entity"),
  });

  const linkedCaseDetails = (
    await Promise.all(
      linkedCases.map((c) =>
        renderLinkedCaseDetailHtml({
          caseData: c,
          allEntities,
          allCases,
          tools,
          resources,
          playbooks,
          settings,
          mediaCtx,
          anchorId: `linked-case-${c.id}`,
        }),
      ),
    )
  ).join("");

  const linkedGroupDetails = (
    await Promise.all(
      linkedGroups.map((g) =>
        renderLinkedGroupDetailHtml({
          group: g,
          allEntities,
          allCases,
          mediaCtx,
          anchorId: `linked-group-${g.id}`,
        }),
      ),
    )
  ).join("");

  const entityBodies = (
    await Promise.all(
      linked.map((e) =>
        renderEntityReportBody(e, relationships, allEntities, settings, {
          headingLevel: "h3",
          anchorPrefix: `e-${e.id}-`,
          allEntities,
          cases: allCases,
          mediaCtx,
        }),
      ),
    )
  ).join(
    '<hr style="margin:2rem 0;border:none;border-top:1px solid #e4e4e7"/>',
  );

  const caseProfileHtml = caseData.profileImage
    ? await renderProfileImageHtml(
        mediaCtx,
        caseData.profileImage,
        scopeProfileZipPath(
          "case",
          caseData.title,
          caseData.id,
          caseData.profileImage,
          mediaCtx.mediaRoot ?? "media",
        ),
        caseData.title,
      )
    : "";

  const descriptionHtml = caseData.description
    ? await renderMarkdownToHtml(caseData.description, {
        flavor: "obsidian",
        entities: allEntities,
        cases: allCases,
      })
    : "";

  const toc = `
  <nav class="toc" aria-label="Table of contents">
    <strong>Contents</strong>
    <ul>
      <li><a href="#summary">Summary</a></li>
      <li><a href="#description">Description</a></li>
      <li><a href="#linked-cases">Linked cases</a></li>
      <li><a href="#linked-groups">Linked groups</a></li>
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
  <p class="meta">${linked.length} linked entities · ${linkedCases.length} linked cases · ${linkedGroups.length} linked groups · ${scopedRels.length} relationships in scope</p>
  ${caseProfileHtml ? `<h3>Profile image</h3>${caseProfileHtml}` : ""}

  <h2 id="description">Description</h2>
  ${descriptionHtml ? `<div class="desc markdown">${descriptionHtml}</div>` : '<p class="muted">No description.</p>'}

  <h2 id="linked-cases">Linked cases</h2>
  ${linkedCaseRows ? `<table><thead><tr><th>Title</th><th>Status</th><th>Entities</th><th>Tags</th></tr></thead><tbody>${linkedCaseRows}</tbody></table>` : '<p class="muted">None</p>'}
  ${linkedCaseDetails ? `<div id="linked-case-details">${linkedCaseDetails}</div>` : ""}

  <h2 id="linked-groups">Linked groups</h2>
  ${linkedGroupRows ? `<table><thead><tr><th>Title</th><th>Entities</th><th>Tags</th></tr></thead><tbody>${linkedGroupRows}</tbody></table>` : '<p class="muted">None</p>'}
  ${linkedGroupDetails ? `<div id="linked-group-details">${linkedGroupDetails}</div>` : ""}

  <h2 id="entities">Linked entities</h2>
  ${entitySummaryRows ? `<table><thead><tr><th>Type</th><th>Name</th><th>Tags</th><th>Fields</th><th>Source</th></tr></thead><tbody>${entitySummaryRows}</tbody></table>` : '<p class="muted">None</p>'}

  <h2 id="relationships">Relationships (within report scope)</h2>
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

export async function renderGroupReportBody(input: {
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
  const {
    group,
    linked,
    linkedCases,
    linkedGroups,
    relationships,
    tools = [],
    resources = [],
    playbooks = [],
    allEntities,
    settings,
    mediaCtx = DEFAULT_MEDIA_CTX,
  } = input;

  const scopeIds = new Set(linked.map((e) => e.id));
  const scopedRels = relationships.filter(
    (r) => scopeIds.has(r.fromEntityId) && scopeIds.has(r.toEntityId),
  );
  const entitySource = (entityId: string) =>
    groupEntitySourceLabel(entityId, group, linkedCases, linkedGroups);

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

  const entitySummaryRows = renderEntitySummaryRows(linked, entitySource);

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

  const linkedGroupRows = linkedGroups
    .map(
      (g) =>
        `<tr>
          <td>${escHtml(g.title)}</td>
          <td>${g.entityIds.length}</td>
          <td>${escHtml(g.tags?.join(", ") ?? "")}</td>
        </tr>`,
    )
    .join("");

  const timelineHtml = renderTimelineReportHtml(
    mergeScopeTimelineEvents([], linked),
    {
      title: "Timeline (group + linked entities)",
      sourceLabel: (ev: ScopedTimelineEvent) => ev.sourceLabel ?? "Entity",
    },
  );

  const linkedCaseDetails = (
    await Promise.all(
      linkedCases.map((c) =>
        renderLinkedCaseDetailHtml({
          caseData: c,
          allEntities,
          allCases: linkedCases,
          tools,
          resources,
          playbooks,
          settings,
          mediaCtx,
          anchorId: `linked-case-${c.id}`,
        }),
      ),
    )
  ).join("");

  const linkedGroupDetails = (
    await Promise.all(
      linkedGroups.map((g) =>
        renderLinkedGroupDetailHtml({
          group: g,
          allEntities,
          allCases: linkedCases,
          mediaCtx,
          anchorId: `linked-group-${g.id}`,
        }),
      ),
    )
  ).join("");

  const entityBodies = (
    await Promise.all(
      linked.map((e) =>
        renderEntityReportBody(e, relationships, allEntities, settings, {
          headingLevel: "h3",
          anchorPrefix: `e-${e.id}-`,
          allEntities,
          cases: linkedCases,
          mediaCtx,
        }),
      ),
    )
  ).join(
    '<hr style="margin:2rem 0;border:none;border-top:1px solid #e4e4e7"/>',
  );

  const groupProfileHtml = group.profileImage
    ? await renderProfileImageHtml(
        mediaCtx,
        group.profileImage,
        scopeProfileZipPath(
          "group",
          group.title,
          group.id,
          group.profileImage,
          mediaCtx.mediaRoot ?? "media",
        ),
        group.title,
      )
    : "";

  const descriptionHtml = group.description
    ? await renderMarkdownToHtml(group.description, {
        flavor: "obsidian",
        entities: allEntities,
        cases: linkedCases,
      })
    : "";

  const toc = `
  <nav class="toc" aria-label="Table of contents">
    <strong>Contents</strong>
    <ul>
      <li><a href="#summary">Summary</a></li>
      <li><a href="#description">Description</a></li>
      <li><a href="#linked-cases">Linked cases</a></li>
      <li><a href="#linked-groups">Linked groups</a></li>
      <li><a href="#entities">Linked entities</a></li>
      <li><a href="#relationships">Relationships</a></li>
      <li><a href="#timeline">Timeline</a></li>
      <li><a href="#entity-details">Entity details</a></li>
    </ul>
  </nav>`;

  return `
  ${toc}
  <h2 id="summary">Summary</h2>
  <p class="meta">Created ${escHtml(group.createdAt.slice(0, 10))} · Updated ${escHtml(group.updatedAt.slice(0, 10))}</p>
  ${group.tags?.length ? `<p class="meta">Tags: ${tagsHtml(group.tags)}</p>` : ""}
  <p class="meta">${linked.length} linked entities · ${linkedCases.length} linked cases · ${linkedGroups.length} linked groups · ${scopedRels.length} relationships in scope</p>
  ${groupProfileHtml ? `<h3>Profile image</h3>${groupProfileHtml}` : ""}

  <h2 id="description">Description</h2>
  ${descriptionHtml ? `<div class="desc markdown">${descriptionHtml}</div>` : '<p class="muted">No description.</p>'}

  <h2 id="linked-cases">Linked cases</h2>
  ${linkedCaseRows ? `<table><thead><tr><th>Title</th><th>Status</th><th>Entities</th><th>Tags</th></tr></thead><tbody>${linkedCaseRows}</tbody></table>` : '<p class="muted">None</p>'}
  ${linkedCaseDetails ? `<div id="linked-case-details">${linkedCaseDetails}</div>` : ""}

  <h2 id="linked-groups">Linked groups</h2>
  ${linkedGroupRows ? `<table><thead><tr><th>Title</th><th>Entities</th><th>Tags</th></tr></thead><tbody>${linkedGroupRows}</tbody></table>` : '<p class="muted">None</p>'}
  ${linkedGroupDetails ? `<div id="linked-group-details">${linkedGroupDetails}</div>` : ""}

  <h2 id="entities">Linked entities</h2>
  ${entitySummaryRows ? `<table><thead><tr><th>Type</th><th>Name</th><th>Tags</th><th>Fields</th><th>Source</th></tr></thead><tbody>${entitySummaryRows}</tbody></table>` : '<p class="muted">None</p>'}

  <h2 id="relationships">Relationships (within report scope)</h2>
  ${relRows ? `<table><thead><tr><th>From</th><th>Relationship</th><th>To</th></tr></thead><tbody>${relRows}</tbody></table>` : '<p class="muted">None</p>'}

  <div id="timeline">${timelineHtml}</div>

  <h2 id="entity-details">Entity details</h2>
  ${entityBodies || '<p class="muted">No linked entities.</p>'}
  `;
}
