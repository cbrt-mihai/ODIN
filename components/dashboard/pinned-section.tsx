import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPinnedItems } from "@/lib/actions/saved-views";
import { listCases } from "@/lib/actions/cases";
import { listEntities } from "@/lib/actions/entities";
import { listGroups } from "@/lib/actions/groups";
import { listTools } from "@/lib/actions/tools";
import { buildListQuery, type ListFilterState } from "@/lib/list-filter/url-state";
import type { SavedView } from "@/lib/types";

const PAGE_PATH: Record<SavedView["page"], string> = {
  entities: "/entities",
  cases: "/cases",
  groups: "/groups",
  tools: "/tools",
  resources: "/resources",
  inbox: "/inbox",
};

function resolvePinnedLink(
  view: SavedView,
  ctx: {
    entities: Awaited<ReturnType<typeof listEntities>>;
    cases: Awaited<ReturnType<typeof listCases>>;
    tools: Awaited<ReturnType<typeof listTools>>;
    groups: Awaited<ReturnType<typeof listGroups>>;
  },
): { id: string; title: string; href: string } | null {
  const filters = view.filters;

  if (view.page === "entities" && filters.entityId) {
    const e = ctx.entities.find((x) => x.id === filters.entityId);
    if (!e) return null;
    return { id: view.id, title: e.displayName, href: `/entities/${e.id}` };
  }
  if (view.page === "cases" && filters.caseId) {
    const c = ctx.cases.find((x) => x.id === filters.caseId);
    if (!c) return null;
    return { id: view.id, title: c.title, href: `/cases/${c.id}` };
  }
  if (view.page === "tools" && filters.toolId) {
    const t = ctx.tools.find((x) => x.id === filters.toolId);
    if (!t) return null;
    return { id: view.id, title: t.name, href: `/tools/${t.id}` };
  }
  if (view.page === "groups" && filters.groupId) {
    const g = ctx.groups.find((x) => x.id === filters.groupId);
    if (!g) return null;
    return { id: view.id, title: g.title, href: `/groups/${g.id}` };
  }

  if (!view.name) return null;

  return {
    id: view.id,
    title: view.name,
    href: `${PAGE_PATH[view.page]}${buildListQuery(filters as ListFilterState)}`,
  };
}

export async function PinnedSection() {
  const [pinned, entities, cases, tools, groups] = await Promise.all([
    getPinnedItems(),
    listEntities(),
    listCases(),
    listTools(),
    listGroups(),
  ]);

  const seenHrefs = new Set<string>();
  const links = pinned
    .map((view) => resolvePinnedLink(view, { entities, cases, tools, groups }))
    .filter((link): link is NonNullable<typeof link> => {
      if (link === null) return false;
      if (seenHrefs.has(link.href)) return false;
      seenHrefs.add(link.href);
      return true;
    });

  if (links.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pinned</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-wrap gap-2">
          {links.map((l) => (
            <li key={l.id}>
              <Link
                href={l.href}
                className="rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm hover:border-zinc-500"
              >
                {l.title}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
