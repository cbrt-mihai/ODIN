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
import { saveResource } from "@/lib/actions/resources";
import type { Resource, ResourceKind } from "@/lib/types";

export function ResourceForm({
  resource,
  onCancel,
  onSaved,
}: {
  resource?: Resource;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(resource?.name ?? "");
  const [kind, setKind] = useState<ResourceKind>(resource?.kind ?? "external");
  const [url, setUrl] = useState(resource?.url ?? "");
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(resource);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await saveResource({
        id: resource?.id,
        name,
        kind,
        ...(kind === "external" ? { url } : {}),
        ...(kind === "internal_page"
          ? {
              page: resource?.page ?? {
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
        <Select value={kind} onValueChange={(v) => setKind(v as ResourceKind)}>
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
          <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
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
