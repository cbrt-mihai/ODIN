"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { linkEntityToGroup } from "@/lib/actions/groups";
import {
  buildEntityIdentityMap,
  entityPickerLabel,
} from "@/lib/entities/identity";
import type { Entity } from "@/lib/types";

export function GroupEntityLinker({
  groupId,
  entities,
  linkedIds,
}: {
  groupId: string;
  entities: Entity[];
  linkedIds: string[];
}) {
  const available = entities.filter((e) => !linkedIds.includes(e.id));
  const identityMap = useMemo(
    () => buildEntityIdentityMap(entities),
    [entities],
  );

  async function link(entityId: string) {
    await linkEntityToGroup(groupId, entityId);
  }

  if (available.length === 0) {
    return <p className="text-sm text-zinc-500">All entities already linked.</p>;
  }

  return (
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
  );
}
