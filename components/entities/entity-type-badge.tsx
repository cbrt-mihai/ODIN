import { Badge, type BadgeProps } from "@/components/ui/badge";
import { entityTypeLabel } from "@/lib/entities/entity-types";
import type { EntityType, Settings } from "@/lib/types";

const BADGE_VARIANTS = new Set<string>([
  "person",
  "organization",
  "domain",
  "general",
  "email",
  "phone",
]);

function badgeVariantForType(type: EntityType): BadgeProps["variant"] {
  return BADGE_VARIANTS.has(type)
    ? (type as NonNullable<BadgeProps["variant"]>)
    : "general";
}

export function EntityTypeBadge({
  type,
  settings,
}: {
  type: EntityType;
  settings?: Pick<Settings, "entityTypes">;
}) {
  const label = entityTypeLabel(type, settings);
  return (
    <Badge variant={badgeVariantForType(type)} className="capitalize">
      {label}
    </Badge>
  );
}
