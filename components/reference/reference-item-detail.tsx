"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Eye,
  Pencil,
  Save,
  Trash2,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MarkdownFieldEditor } from "@/components/entities/markdown-field-editor";
import { HtmlPageReadonly } from "@/components/markdown/html-page-readonly";
import { MarkdownReadonly } from "@/components/markdown/markdown-readonly";
import { TagInput } from "@/components/ui/tag-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { saveResource } from "@/lib/actions/resources";
import { saveTool, deleteTool } from "@/lib/actions/tools";
import { deleteResource } from "@/lib/actions/resources";
import type { MarkdownFlavor } from "@/lib/markdown/render";
import type {
  Entity,
  InternalPageContent,
  Resource,
  ResourceKind,
  Tool,
  ToolKind,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ReferenceItem = Tool | Resource;
type ReferenceKind = ToolKind | ResourceKind;

export function ReferenceItemDetail({
  item: initial,
  variant,
  entities = [],
}: {
  item: ReferenceItem;
  variant: "tool" | "resource";
  entities?: Entity[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [item, setItem] = useState(initial);
  const [viewMode, setViewMode] = useState(true);
  const [saving, setSaving] = useState(false);

  const backHref = variant === "tool" ? "/tools" : "/resources";
  const backLabel = variant === "tool" ? "Tools" : "Resources";
  const Icon = variant === "tool" ? Wrench : BookOpen;

  function currentPage(): InternalPageContent {
    return (
      item.page ?? {
        format: "markdown",
        flavor: "rich" as MarkdownFlavor,
        body: "",
      }
    );
  }

  function pagePayload(): InternalPageContent | undefined {
    if (item.kind !== "internal_page") return undefined;
    const pg = currentPage();
    if (pg.format === "html") {
      return { format: "html", body: pg.body };
    }
    return {
      format: "markdown",
      flavor: pg.flavor ?? "rich",
      body: pg.body,
    };
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        tags: item.tags,
        kind: item.kind as ToolKind,
        url: item.kind === "external" ? item.url : undefined,
        page: pagePayload(),
      };
      if (variant === "tool") {
        await saveTool(payload);
      } else {
        await saveResource({
          ...payload,
          kind: item.kind as ResourceKind,
        });
      }
      setViewMode(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete ${variant}`,
      description: `Move "${item.name}" to trash?`,
      confirmLabel: "Move to trash",
      destructive: true,
    });
    if (!ok) return;
    if (variant === "tool") await deleteTool(item.id);
    else await deleteResource(item.id);
    router.push(backHref);
    router.refresh();
  }

  const page = currentPage();
  const isHtmlPage = page.format === "html";
  const hasPageContent = Boolean(page.body?.trim());
  const hasDescription = Boolean(item.description?.trim());

  return (
    <div className="space-y-8">
      <PageHeader
        backHref={backHref}
        backLabel={backLabel}
        title={
          viewMode ? (
            item.name
          ) : (
            <Input
              value={item.name}
              onChange={(e) => setItem((x) => ({ ...x, name: e.target.value }))}
              className="max-w-md text-2xl font-bold sm:text-3xl h-auto py-1"
            />
          )
        }
        subtitle={
          viewMode ? (
            <>
              Updated {formatDate(item.updatedAt)}
              {item.category && (
                <span className="text-zinc-600"> · {item.category}</span>
              )}
            </>
          ) : (
            "Edit metadata and page content, then save."
          )
        }
        badge={
          <Badge variant="outline" className="capitalize shrink-0">
            {item.kind.replace("_", " ")}
          </Badge>
        }
        actions={
          <>
            <Button
              variant={viewMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => setViewMode(true)}
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            <Button
              variant={!viewMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => setViewMode(false)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            {!viewMode && (
              <Button size="sm" onClick={save} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {(item.tags ?? []).length > 0 && (
        <TagInput tags={item.tags ?? []} onChange={() => {}} disabled />
      )}

      {viewMode ? (
        <div className="space-y-6">
          {item.kind === "external" && item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="interactive-card group flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/50 p-6 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition-transform group-hover:scale-105">
                  <ExternalLink className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">Open external link</p>
                  <p className="mt-0.5 max-w-lg truncate text-sm text-zinc-500">
                    {item.url}
                  </p>
                </div>
              </div>
              <span className="text-sm text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
                Open →
              </span>
            </a>
          )}

          {hasDescription && (
            <article className="prose-surface rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500">
                Overview
              </h2>
              <MarkdownReadonly
                content={item.description!}
                flavor="rich"
                entities={entities}
              />
            </article>
          )}

          {item.kind === "internal_page" && (
            <article className="prose-surface rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-10 lg:p-12">
              {hasPageContent ? (
                isHtmlPage ? (
                  <HtmlPageReadonly content={page.body} />
                ) : (
                  <MarkdownReadonly
                    content={page.body}
                    flavor={page.flavor ?? "rich"}
                    entities={entities}
                  />
                )
              ) : (
                <div className="flex flex-col items-center py-16 text-center">
                  <Icon className="h-10 w-10 text-zinc-600" />
                  <p className="mt-4 text-zinc-400">No page content yet.</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(false)}
                  >
                    <Pencil className="h-4 w-4" />
                    Write content
                  </Button>
                </div>
              )}
            </article>
          )}

          {item.kind === "external" && !hasDescription && (
            <p className="text-sm text-zinc-500">
              This is an external {variant}. Use the link above to open it.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <CollapsibleCard
            id={`${variant}-reference-details`}
            title="Details"
            defaultOpen
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>Kind</Label>
                <Select
                  value={item.kind}
                  onValueChange={(kind) =>
                    setItem((x) => ({
                      ...x,
                      kind: kind as ReferenceKind,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External link</SelectItem>
                    <SelectItem value="internal_page">Internal page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {item.kind === "external" && (
                <div className="space-y-1 sm:col-span-2">
                  <Label>URL</Label>
                  <Input
                    type="url"
                    value={item.url ?? ""}
                    onChange={(e) =>
                      setItem((x) => ({ ...x, url: e.target.value }))
                    }
                    placeholder="https://"
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label>Category</Label>
                <Input
                  value={item.category ?? ""}
                  onChange={(e) =>
                    setItem((x) => ({
                      ...x,
                      category: e.target.value || undefined,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Tags</Label>
                <TagInput
                  tags={item.tags ?? []}
                  onChange={(tags) => setItem((x) => ({ ...x, tags }))}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Short description (Markdown)</Label>
                <Textarea
                  value={item.description ?? ""}
                  onChange={(e) =>
                    setItem((x) => ({
                      ...x,
                      description: e.target.value || undefined,
                    }))
                  }
                  rows={3}
                  placeholder="Brief summary shown in lists and at top of page…"
                />
              </div>
            </div>
          </CollapsibleCard>

          {item.kind === "internal_page" && (
            <CollapsibleCard
              id={`${variant}-reference-page-content`}
              title={isHtmlPage ? "Page content (HTML)" : "Page content"}
              defaultOpen
            >
              {!isHtmlPage && (
                <div className="mb-4 flex flex-wrap items-end gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Markdown flavor</Label>
                    <Select
                      value={page.flavor ?? "rich"}
                      onValueChange={(v) =>
                        setItem((x) => ({
                          ...x,
                          page: {
                            ...currentPage(),
                            format: "markdown",
                            flavor: v as MarkdownFlavor,
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rich">Rich (GFM)</SelectItem>
                        <SelectItem value="obsidian">Obsidian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "min-h-[min(70vh,640px)] rounded-lg border border-zinc-800",
                )}
              >
                {isHtmlPage ? (
                  <Textarea
                    value={page.body}
                    onChange={(e) =>
                      setItem((x) => ({
                        ...x,
                        page: {
                          format: "html",
                          body: e.target.value,
                        },
                      }))
                    }
                    rows={24}
                    className="min-h-[min(70vh,640px)] font-mono text-sm"
                    placeholder="<h1>Page title</h1>…"
                  />
                ) : (
                  <MarkdownFieldEditor
                    value={page.body}
                    onChange={(body) =>
                      setItem((x) => ({
                        ...x,
                        page: {
                          ...currentPage(),
                          format: "markdown",
                          body,
                        },
                      }))
                    }
                    flavor={page.flavor ?? "rich"}
                    entities={entities}
                    showPreview={false}
                    minRows={24}
                    placeholder="Write your reference page…"
                  />
                )}
                <p className="mt-2 text-xs text-zinc-500">
                  Switch to View mode to see the full rendered page.
                </p>
              </div>
            </CollapsibleCard>
          )}
        </div>
      )}
    </div>
  );
}
