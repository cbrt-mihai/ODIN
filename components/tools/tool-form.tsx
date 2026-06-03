"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveTool } from "@/lib/actions/tools";
import type { Tool, ToolKind } from "@/lib/types";

export function ToolForm({
  tool,
  onCancel,
  onSaved,
}: {
  tool?: Tool;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(tool?.name ?? "");
  const [kind, setKind] = useState<ToolKind>(tool?.kind ?? "external");
  const [url, setUrl] = useState(tool?.url ?? "");
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(tool);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await saveTool({
        id: tool?.id,
        name,
        kind,
        ...(kind === "external" ? { url } : {}),
        ...(kind === "internal_page"
          ? {
              page: tool?.page ?? {
                format: "markdown",
                flavor: "rich",
                body: "",
              },
            }
          : {}),
      });
      if (!isEdit) {
        setName("");
        setUrl("");
      }
      onSaved?.();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Kind</Label>
        <Select value={kind} onValueChange={(v) => setKind(v as ToolKind)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="external">External</SelectItem>
            <SelectItem value="internal_page">Internal page</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {kind === "external" && (
        <div className="min-w-[200px] flex-1 space-y-1">
          <Label>URL</Label>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
          />
        </div>
      )}
      <Button type="submit" disabled={loading}>
        {isEdit ? "Save" : "Add"}
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      )}
    </form>
  );
}
