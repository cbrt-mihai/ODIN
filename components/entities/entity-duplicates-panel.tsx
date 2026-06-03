"use client";

import { useEffect, useMemo, useState } from "react";
import { collectFieldValues } from "@/lib/entities/contact-fields";
import { findDuplicateCandidates } from "@/lib/actions/duplicates";
import { MergePanel } from "@/components/entities/merge-panel";
import type { Entity } from "@/lib/types";

export function EntityDuplicatesPanel({
  entity,
  allEntities,
}: {
  entity: Entity;
  allEntities?: Entity[];
}) {
  const [dupes, setDupes] = useState<Entity[]>([]);

  const contactOptions = useMemo(
    () => ({
      emails: collectFieldValues(entity, "email"),
      phones: collectFieldValues(entity, "phone"),
    }),
    [entity],
  );

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      findDuplicateCandidates(
        entity.displayName,
        entity.aliases ?? [],
        entity.id,
        contactOptions,
      ).then((results) => {
        if (!cancelled) setDupes(results);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    entity.displayName,
    entity.aliases,
    entity.id,
    contactOptions,
  ]);

  if (dupes.length === 0) return null;

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-amber-200/90">
        Possible duplicates ({dupes.length})
      </p>
      {dupes.map((secondary) => (
        <MergePanel
          key={secondary.id}
          primary={entity}
          secondary={secondary}
          allEntities={allEntities}
        />
      ))}
    </div>
  );
}
