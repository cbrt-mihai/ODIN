"use client";

import { EntityTypeBadge } from "@/components/entities/entity-type-badge";
import type { EntityIdentity } from "@/lib/entities/identity";
import type { EntityType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EntityRefLabel({
  displayName,
  qualifiedName,
  disambiguator,
  referenceSlug,
  type,
  isHomonym,
  monoPath,
  className,
  showTypeBadge = false,
}: {
  displayName: string;
  qualifiedName: string;
  disambiguator?: string;
  referenceSlug?: string;
  type?: EntityType;
  isHomonym?: boolean;
  /** Show @{slug} under the name. */
  monoPath?: boolean;
  className?: string;
  showTypeBadge?: boolean;
}) {
  const showQualified = isHomonym && qualifiedName !== displayName;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {showTypeBadge && type && <EntityTypeBadge type={type} />}
        <span className="truncate font-medium text-zinc-100">
          {showQualified ? qualifiedName : displayName}
        </span>
      </div>
      {(monoPath || (isHomonym && disambiguator)) && (
        <p className="mt-0.5 truncate font-mono text-xs text-zinc-500">
          {monoPath && referenceSlug ? `@${referenceSlug}` : disambiguator}
        </p>
      )}
    </div>
  );
}

export function EntityRefLabelFromIdentity({
  identity,
  monoPath = true,
  showTypeBadge = false,
  className,
}: {
  identity: EntityIdentity;
  monoPath?: boolean;
  showTypeBadge?: boolean;
  className?: string;
}) {
  return (
    <EntityRefLabel
      displayName={identity.displayName}
      qualifiedName={identity.qualifiedName}
      disambiguator={identity.disambiguator}
      referenceSlug={identity.referenceSlug}
      type={identity.type}
      isHomonym={identity.isHomonym}
      monoPath={monoPath}
      showTypeBadge={showTypeBadge}
      className={className}
    />
  );
}
