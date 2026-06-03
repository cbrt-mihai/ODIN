"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { buildEntityIdentityMap, entityPickerLabel } from "@/lib/entities/identity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { linkEntityToCase } from "@/lib/actions/cases";
import type { Entity } from "@/lib/types";

export function CaseEntityLinker({
  caseId,
  entities,
  linkedIds,
}: {
  caseId: string;
  entities: Entity[];
  linkedIds: string[];
}) {
  const router = useRouter();
  const available = entities.filter((e) => !linkedIds.includes(e.id));
  const identityMap = useMemo(
    () => buildEntityIdentityMap(entities),
    [entities],
  );

  async function link(entityId: string) {
    await linkEntityToCase(caseId, entityId);
    router.refresh();
  }

  if (available.length === 0) {
    return <p className="text-sm text-zinc-500">All entities already linked.</p>;
  }

  return (
    <div className="flex gap-2">
      <Select onValueChange={link}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select entity to link" />
        </SelectTrigger>
        <SelectContent>
          {available.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {entityPickerLabel(e, identityMap)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
