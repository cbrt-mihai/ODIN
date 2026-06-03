import type { ComponentType } from "react";
import { CasesDoc } from "@/components/docs/sections/cases";
import { CustomizationDoc } from "@/components/docs/sections/customization";
import { DataDoc } from "@/components/docs/sections/data";
import { EntitiesDoc } from "@/components/docs/sections/entities";
import { GroupsDoc } from "@/components/docs/sections/groups";
import { InvestigationDoc } from "@/components/docs/sections/investigation";
import { ImportExportDoc } from "@/components/docs/sections/import-export";
import { InboxDoc } from "@/components/docs/sections/inbox";
import { OverviewDoc } from "@/components/docs/sections/overview";
import { PlaybooksDoc } from "@/components/docs/sections/playbooks";
import { RelationshipsDoc } from "@/components/docs/sections/relationships";
import { SettingsDoc } from "@/components/docs/sections/settings";
import { ShortcutsDoc } from "@/components/docs/sections/shortcuts";
import { ToolsResourcesDoc } from "@/components/docs/sections/tools-resources";

/** Serializable nav entry — safe to pass to client components. */
export type DocPageMeta = {
  slug: string;
  title: string;
  description: string;
  order: number;
};

export type DocPage = DocPageMeta & {
  Content: ComponentType;
};

export const DOC_PAGES: DocPage[] = [
  {
    slug: "overview",
    title: "Overview",
    description: "What TheBlacklist is and how to get started.",
    order: 0,
    Content: OverviewDoc,
  },
  {
    slug: "entities",
    title: "Entities",
    description: "Profiles, field types, context, proof, gallery, merge.",
    order: 1,
    Content: EntitiesDoc,
  },
  {
    slug: "cases",
    title: "Cases",
    description: "Investigation workspaces, timelines, and reports.",
    order: 2,
    Content: CasesDoc,
  },
  {
    slug: "groups",
    title: "Groups",
    description: "Cross-case entity collections and scoped insights.",
    order: 3,
    Content: GroupsDoc,
  },
  {
    slug: "relationships",
    title: "Relationships",
    description: "Links between entities and the graph view.",
    order: 4,
    Content: RelationshipsDoc,
  },
  {
    slug: "customization",
    title: "Customization",
    description: "Layout, profile images, references, and wide workspace.",
    order: 4.5,
    Content: CustomizationDoc,
  },
  {
    slug: "investigation",
    title: "Investigation visuals",
    description: "Timeline maps, indicators, charts, and dashboards.",
    order: 5,
    Content: InvestigationDoc,
  },
  {
    slug: "tools-resources",
    title: "Tools & resources",
    description: "Bookmarks and internal reference pages.",
    order: 6,
    Content: ToolsResourcesDoc,
  },
  {
    slug: "inbox",
    title: "Inbox",
    description: "Quick capture and triage into your data.",
    order: 7,
    Content: InboxDoc,
  },
  {
    slug: "playbooks",
    title: "Playbooks",
    description: "Reusable investigation checklists.",
    order: 8,
    Content: PlaybooksDoc,
  },
  {
    slug: "import-export",
    title: "Import & export",
    description: "Backups, case ZIP exports, and HTML reports.",
    order: 9,
    Content: ImportExportDoc,
  },
  {
    slug: "settings",
    title: "Settings",
    description: "Theme, field types, confidence, and templates.",
    order: 10,
    Content: SettingsDoc,
  },
  {
    slug: "shortcuts",
    title: "Shortcuts",
    description: "Command palette and keyboard tips.",
    order: 11,
    Content: ShortcutsDoc,
  },
  {
    slug: "data",
    title: "Your data",
    description: "Where files live and how they are stored.",
    order: 12,
    Content: DataDoc,
  },
];

export function getDocPage(slug: string | undefined): DocPage | undefined {
  const key = slug ?? "overview";
  return DOC_PAGES.find((p) => p.slug === key);
}

export function getDocSlugs(): string[] {
  return DOC_PAGES.map((p) => p.slug);
}

export function getDocPageNav(): DocPageMeta[] {
  return DOC_PAGES.map(({ slug, title, description, order }) => ({
    slug,
    title,
    description,
    order,
  })).sort((a, b) => a.order - b.order);
}
