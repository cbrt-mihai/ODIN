"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { DuplicateWarning } from "@/components/entities/duplicate-warning";
import { createEntity } from "@/lib/actions/entities";
import { enabledEntityTypes } from "@/lib/entities/entity-types";
import type { EntityType, EntityTypeDefinition } from "@/lib/types";

export function CreateEntityForm({
  entityTypes,
}: {
  entityTypes: EntityTypeDefinition[];
}) {
  const router = useRouter();
  const enabled = enabledEntityTypes({ entityTypes });
  const defaultType = enabled[0] ?? "person";
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<EntityType>(defaultType);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const entity = await createEntity({ type, displayName: name });
      startTransition(() => {
        router.push(`/entities/${entity.id}`);
      });
    } finally {
      setSubmitting(false);
    }
  }

  const loading = submitting || isPending;

  return (
    <div className="space-y-3">
    <DuplicateWarning name={name} />
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as EntityType)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {entityTypes
              .filter((d) => d.enabled)
              .sort((a, b) => a.order - b.order)
              .map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[200px] flex-1 space-y-1">
        <Label>Display name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name or identifier"
        />
      </div>
      <Button type="submit" disabled={loading || !name.trim()}>
        {loading ? "Opening entity…" : "Create entity"}
      </Button>
      {isPending && (
        <p className="text-xs text-zinc-500">
          Loading entity workspace…
        </p>
      )}
    </form>
    </div>
  );
}
