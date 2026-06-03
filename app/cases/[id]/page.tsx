import { notFound } from "next/navigation";
import { CaseEditor } from "@/components/cases/case-editor";
import { ReferenceProvider } from "@/components/references/reference-context";
import { CaseReportExportButtons } from "@/components/reports/report-export-buttons";
import { CasePlaybooksPanel } from "@/components/cases/case-playbooks-panel";
import { CaseTimeline } from "@/components/cases/case-timeline";
import {
  CaseEntityLinkerSuspense,
  CaseLinkedSectionsSuspense,
} from "@/components/cases/case-detail-sections";
import { MarkdownPreview } from "@/components/markdown/markdown-preview";
import { CaseCaseLinker } from "@/components/cases/case-case-linker";
import { CaseGroupLinker } from "@/components/cases/case-group-linker";
import { ReorderablePanels } from "@/components/layout/reorderable-panels";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { getCaseById, listCases } from "@/lib/actions/cases";
import { listGroups } from "@/lib/actions/groups";
import { listEntities } from "@/lib/actions/entities";
import { listPlaybooks } from "@/lib/actions/playbooks";
import { getSettings } from "@/lib/storage";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [caseData, settings, playbooks, entities, allCases, allGroups] =
    await Promise.all([
      getCaseById(id),
      getSettings(),
      listPlaybooks(),
      listEntities(),
      listCases(),
      listGroups(),
    ]);

  if (!caseData) notFound();

  return (
    <ReferenceProvider entities={entities} cases={allCases}>
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
        <p className="text-sm text-zinc-400">Export case report</p>
        <CaseReportExportButtons caseId={caseData.id} />
      </div>
      <CaseEditor caseData={caseData} entities={entities} cases={allCases} />

      {caseData.description && (
        <div className="max-w-3xl">
          <MarkdownPreview
            content={caseData.description}
            flavor="obsidian"
            entities={entities}
          />
        </div>
      )}

      <ReorderablePanels
        scope="case"
        panels={[
          {
            id: "playbooks",
            defaultOpen: true,
            node: (
              <CasePlaybooksPanel caseData={caseData} playbooks={playbooks} />
            ),
          },
          {
            id: "timeline",
            defaultOpen: true,
            node: (
              <CaseTimeline
                caseId={caseData.id}
                events={caseData.events}
                eventTypes={settings.eventTypes}
              />
            ),
          },
          {
            id: "linked-cases",
            defaultOpen: false,
            node: (
              <CollapsibleCard
                id="case-linked-cases"
                title="Linked cases"
                defaultOpen={false}
              >
                <CaseCaseLinker
                  caseId={caseData.id}
                  cases={allCases}
                  linkedCaseIds={caseData.linkedCaseIds ?? []}
                />
              </CollapsibleCard>
            ),
          },
          {
            id: "linked-groups",
            defaultOpen: false,
            node: (
              <CollapsibleCard
                id="case-linked-groups"
                title="Linked groups"
                defaultOpen={false}
              >
                <CaseGroupLinker
                  caseId={caseData.id}
                  groups={allGroups}
                  linkedGroupIds={caseData.groupIds ?? []}
                />
              </CollapsibleCard>
            ),
          },
          {
            id: "investigation",
            defaultOpen: false,
            node: <CaseLinkedSectionsSuspense caseData={caseData} />,
          },
          {
            id: "entity-linker",
            defaultOpen: false,
            node: (
              <CaseEntityLinkerSuspense
                caseId={caseData.id}
                entityIds={caseData.entityIds}
              />
            ),
          },
        ]}
      />
    </div>
    </ReferenceProvider>
  );
}
