import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { RelationshipLinkRow } from "@/components/entities/relationship-link-row";
import { getEntityRelationships } from "@/lib/actions/relationships";
import { getSettings } from "@/lib/storage";
import {
  incomingLinkParts,
  outgoingLinkParts,
} from "@/lib/relationships/helpers";
import {
  findEntityLinkBacklinks,
  findWikilinkBacklinks,
} from "@/lib/entities/backlinks";
import type { Entity } from "@/lib/types";
import Link from "next/link";

export async function EntityLinksPanel({
  entityId,
  entities,
}: {
  entityId: string;
  entities: Entity[];
}) {
  const [{ outgoing, incoming, resolve }, settings] = await Promise.all([
    getEntityRelationships(entityId),
    getSettings(),
  ]);
  const types = settings.relationshipTypes;
  const linkBacklinks = findEntityLinkBacklinks(entityId, entities);
  const wikiBacklinks = findWikilinkBacklinks(entityId, entities);

  const relationshipRows = [
    ...outgoing.map((r) => ({
      rel: r,
      label: outgoingLinkParts(r, resolve(r.toEntityId), types).label,
      other: resolve(r.toEntityId),
    })),
    ...incoming.map((r) => ({
      rel: r,
      label: incomingLinkParts(r, resolve(r.fromEntityId), types).label,
      other: resolve(r.fromEntityId),
    })),
  ].sort((a, b) => {
    const an = a.other?.displayName ?? "";
    const bn = b.other?.displayName ?? "";
    return an.localeCompare(bn);
  });

  return (
    <CollapsibleCard
      id="entity-linked-entities"
      title="Linked entities"
      contentClassName="space-y-4 text-sm"
    >
      <div>
        <p className="mb-2 text-xs font-medium uppercase text-zinc-500">
          Relationships
        </p>
        {relationshipRows.length === 0 ? (
          <p className="text-zinc-500">None</p>
        ) : (
          <ul className="space-y-2">
            {relationshipRows.map(({ rel, label, other }) => (
              <RelationshipLinkRow
                key={rel.id}
                relationship={rel}
                viewerEntityId={entityId}
                viewerName={
                  entities.find((e) => e.id === entityId)?.displayName ??
                  "This profile"
                }
                label={label}
                other={other}
                confidenceTypes={settings.confidenceTypes}
                relationshipTypes={types}
              />
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase text-zinc-500">
          Field links (backlinks)
        </p>
        {linkBacklinks.length === 0 ? (
          <p className="text-zinc-500">None</p>
        ) : (
          <ul className="space-y-2">
            {linkBacklinks.map((b, i) => (
              <li key={`${b.entityId}-${i}`}>
                <Link
                  href={`/entities/${b.entityId}`}
                  className="text-blue-400 hover:underline"
                >
                  {b.displayName}
                </Link>
                <span className="text-zinc-500">
                  {" "}
                  — {b.sectionTitle} / {b.fieldLabel}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase text-zinc-500">
          Wikilinks (backlinks)
        </p>
        {wikiBacklinks.length === 0 ? (
          <p className="text-zinc-500">None</p>
        ) : (
          <ul className="space-y-2">
            {wikiBacklinks.map((b, i) => (
              <li key={`${b.entityId}-${b.linkText}-${i}`}>
                <Link
                  href={`/entities/${b.entityId}`}
                  className="text-blue-400 hover:underline"
                >
                  {b.displayName}
                </Link>
                <span className="text-zinc-500">
                  {" "}
                  — {b.sectionTitle} / {b.fieldLabel} ([[{b.linkText}]])
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CollapsibleCard>
  );
}
