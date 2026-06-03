"use client";

import { AlertTriangle } from "lucide-react";
import { getEntityIdentity } from "@/lib/entities/identity";
import type { Entity } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EntityDisambiguation({
  entity,
  allEntities,
  className,
  showHomonymWarning = true,
}: {
  entity: Entity;
  allEntities?: Entity[];
  className?: string;
  showHomonymWarning?: boolean;
}) {
  if (!allEntities) return null;

  const identity = getEntityIdentity(entity, allEntities);

  if (!identity.isHomonym && !entity.disambiguator?.trim()) return null;

  return (
    <div className={cn("space-y-1", className)}>
      {identity.isHomonym && (
        <p className="truncate text-xs text-zinc-500">
          {identity.disambiguator &&
          identity.disambiguator.toLowerCase() !==
            identity.referenceSlug.toLowerCase()
            ? `${identity.disambiguator} · @${identity.referenceSlug}`
            : `@${identity.referenceSlug}`}
        </p>
      )}
      {!identity.isHomonym && identity.disambiguator && (
        <p className="truncate text-xs text-zinc-500">{identity.disambiguator}</p>
      )}
      {showHomonymWarning && identity.isHomonym && (
        <p className="inline-flex items-center gap-1 text-xs text-amber-400/90">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {identity.homonymCount + 1} records share this name
        </p>
      )}
    </div>
  );
}
