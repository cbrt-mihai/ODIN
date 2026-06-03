import AdmZip from "adm-zip";
import { getEntityById, listEntities } from "@/lib/actions/entities";
import { listRelationships } from "@/lib/actions/relationships";
import { loadCaseReportContext, loadGroupReportContext } from "@/lib/reports/build-context";
import { renderCaseReportHtml } from "@/lib/reports/case-html";
import { renderCaseReportPdf } from "@/lib/reports/case-pdf";
import { renderEntityReportHtml } from "@/lib/reports/entity-html";
import { renderEntityReportPdf } from "@/lib/reports/entity-pdf";
import { renderGroupReportHtml } from "@/lib/reports/group-html";
import { renderGroupReportPdf } from "@/lib/reports/group-pdf";
import {
  addMediaEntriesToZip,
  buildPdfImageMapFromBuffers,
  collectEntityMediaFiles,
  collectProfileMediaFile,
  readMediaBuffers,
  safeReportPathSegment,
} from "@/lib/reports/media";
import { getSettings } from "@/lib/storage";
import type { Case, Entity, Group } from "@/lib/types";

const MEDIA_ROOT = "media";

function reportBaseName(label: string) {
  return safeReportPathSegment(label, "report");
}

function collectScopeMediaEntries(input: {
  entities: Entity[];
  mediaRoot: string;
  caseProfile?: { title: string; id: string; profileImage: Case["profileImage"] };
  groupProfile?: { title: string; id: string; profileImage: Group["profileImage"] };
  linkedCases?: Case[];
  linkedGroups?: Group[];
}) {
  const entries = [];
  if (input.caseProfile?.profileImage) {
    entries.push(
      collectProfileMediaFile(
        "case",
        input.caseProfile.title,
        input.caseProfile.id,
        input.caseProfile.profileImage,
        input.mediaRoot,
      ),
    );
  }
  if (input.groupProfile?.profileImage) {
    entries.push(
      collectProfileMediaFile(
        "group",
        input.groupProfile.title,
        input.groupProfile.id,
        input.groupProfile.profileImage,
        input.mediaRoot,
      ),
    );
  }
  for (const linkedCase of input.linkedCases ?? []) {
    if (linkedCase.profileImage) {
      entries.push(
        collectProfileMediaFile(
          "case",
          linkedCase.title,
          linkedCase.id,
          linkedCase.profileImage,
          input.mediaRoot,
        ),
      );
    }
  }
  for (const linkedGroup of input.linkedGroups ?? []) {
    if (linkedGroup.profileImage) {
      entries.push(
        collectProfileMediaFile(
          "group",
          linkedGroup.title,
          linkedGroup.id,
          linkedGroup.profileImage,
          input.mediaRoot,
        ),
      );
    }
  }
  const profileEntries = entries.filter(
    (entry): entry is NonNullable<typeof entry> => Boolean(entry),
  );
  const entityEntries = input.entities.flatMap((entity) =>
    collectEntityMediaFiles(entity, input.mediaRoot),
  );
  return [...profileEntries, ...entityEntries];
}

export async function exportCaseReportZip(caseId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const context = await loadCaseReportContext(caseId);
  if (!context) throw new Error("Case not found");

  const mediaCtx = { mode: "relative" as const, mediaRoot: MEDIA_ROOT };
  const reportInput = { ...context, mediaCtx };

  const mediaEntries = collectScopeMediaEntries({
    entities: context.linked,
    mediaRoot: MEDIA_ROOT,
    caseProfile: {
      title: context.caseData.title,
      id: context.caseData.id,
      profileImage: context.caseData.profileImage,
    },
    linkedCases: context.linkedCases,
    linkedGroups: context.linkedGroups,
  });
  const mediaBuffers = await readMediaBuffers(
    mediaEntries.map((entry) => entry.diskPath),
  );
  const pdfImages = buildPdfImageMapFromBuffers({
    buffers: mediaBuffers,
    entities: context.linked,
    caseProfile: context.caseData.profileImage,
    caseId: context.caseData.id,
  });

  const [html, pdf] = await Promise.all([
    renderCaseReportHtml(reportInput),
    renderCaseReportPdf({ ...reportInput, pdfImages }),
  ]);

  const zip = new AdmZip();
  zip.addFile("report.html", Buffer.from(html, "utf8"));
  zip.addFile("report.pdf", pdf);
  addMediaEntriesToZip(zip, mediaEntries, mediaBuffers);

  const base = reportBaseName(context.caseData.title);
  return { buffer: zip.toBuffer(), filename: `${base}-report.zip` };
}

export async function exportEntityReportZip(entityId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const [entity, relationships, allEntities, settings] = await Promise.all([
    getEntityById(entityId),
    listRelationships(),
    listEntities(),
    getSettings(),
  ]);

  if (!entity) throw new Error("Entity not found");

  const mediaCtx = { mode: "relative" as const, mediaRoot: MEDIA_ROOT };
  const mediaEntries = collectEntityMediaFiles(entity, MEDIA_ROOT);
  const mediaBuffers = await readMediaBuffers(
    mediaEntries.map((entry) => entry.diskPath),
  );
  const pdfImages = buildPdfImageMapFromBuffers({
    buffers: mediaBuffers,
    entities: [entity],
  });

  const [html, pdf] = await Promise.all([
    renderEntityReportHtml(entity, relationships, allEntities, mediaCtx),
    renderEntityReportPdf(entity, relationships, allEntities, pdfImages),
  ]);

  const zip = new AdmZip();
  zip.addFile("report.html", Buffer.from(html, "utf8"));
  zip.addFile("report.pdf", pdf);
  addMediaEntriesToZip(zip, mediaEntries, mediaBuffers);

  const base = reportBaseName(entity.displayName);
  return { buffer: zip.toBuffer(), filename: `${base}-report.zip` };
}

export async function exportGroupReportZip(groupId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const context = await loadGroupReportContext(groupId);
  if (!context) throw new Error("Group not found");

  const mediaCtx = { mode: "relative" as const, mediaRoot: MEDIA_ROOT };
  const reportInput = { ...context, mediaCtx };

  const mediaEntries = collectScopeMediaEntries({
    entities: context.linked,
    mediaRoot: MEDIA_ROOT,
    groupProfile: {
      title: context.group.title,
      id: context.group.id,
      profileImage: context.group.profileImage,
    },
    linkedCases: context.linkedCases,
    linkedGroups: context.linkedGroups,
  });
  const mediaBuffers = await readMediaBuffers(
    mediaEntries.map((entry) => entry.diskPath),
  );
  const pdfImages = buildPdfImageMapFromBuffers({
    buffers: mediaBuffers,
    entities: context.linked,
    groupProfile: context.group.profileImage,
    groupId: context.group.id,
  });

  const [html, pdf] = await Promise.all([
    renderGroupReportHtml(reportInput),
    renderGroupReportPdf({ ...reportInput, pdfImages }),
  ]);

  const zip = new AdmZip();
  zip.addFile("report.html", Buffer.from(html, "utf8"));
  zip.addFile("report.pdf", pdf);
  addMediaEntriesToZip(zip, mediaEntries, mediaBuffers);

  const base = reportBaseName(context.group.title);
  return { buffer: zip.toBuffer(), filename: `${base}-report.zip` };
}
