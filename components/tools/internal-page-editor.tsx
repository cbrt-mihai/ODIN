"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkdownFieldEditor } from "@/components/entities/markdown-field-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveResource } from "@/lib/actions/resources";
import { saveTool } from "@/lib/actions/tools";
import type { MarkdownFlavor } from "@/lib/markdown/render";
import type { Entity, Resource, Tool } from "@/lib/types";

export function InternalPageEditor({
  item,
  kind,
  entities = [],
}: {
  item: Tool | Resource;
  kind: "tool" | "resource";
  entities?: Entity[];
}) {
  const router = useRouter();
  const page = item.page ?? {
    format: "markdown" as const,
    flavor: "rich" as MarkdownFlavor,
    body: "",
  };
  const [body, setBody] = useState(page.body);
  const [flavor, setFlavor] = useState<MarkdownFlavor>(
    page.flavor ?? "rich",
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const pagePayload = { format: "markdown" as const, flavor, body };
      if (kind === "tool") {
        await saveTool({
          id: item.id,
          name: item.name,
          kind: (item as Tool).kind,
          page: pagePayload,
        });
      } else {
        await saveResource({
          id: item.id,
          name: item.name,
          kind: (item as Resource).kind,
          page: pagePayload,
        });
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Markdown flavor</Label>
          <Select
            value={flavor}
            onValueChange={(v) => setFlavor(v as MarkdownFlavor)}
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
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save page"}
        </Button>
      </div>
      <MarkdownFieldEditor
        value={body}
        onChange={setBody}
        flavor={flavor}
        entities={entities}
        placeholder="Write reference content…"
      />
    </div>
  );
}
