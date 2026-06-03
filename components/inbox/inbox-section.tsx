import { InboxItemRow } from "@/components/inbox/inbox-item-row";
import type { Entity, FieldTypeDefinition, InboxItem } from "@/lib/types";

export function InboxSection({
  title,
  description,
  items,
  entities,
  appendableFieldTypes,
  emptyMessage,
  highlightItemId,
}: {
  title: string;
  description?: string;
  items: InboxItem[];
  entities: Entity[];
  appendableFieldTypes: FieldTypeDefinition[];
  emptyMessage: string;
  highlightItemId?: string;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-zinc-200">
          {title}
          {items.length > 0 && (
            <span className="ml-2 font-normal text-zinc-500">
              ({items.length})
            </span>
          )}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {items.length === 0 ? (
          <li className="px-4 py-6 text-sm text-zinc-500">{emptyMessage}</li>
        ) : (
          items.map((item) => (
            <InboxItemRow
              key={item.id}
              item={item}
              entities={entities}
              appendableFieldTypes={appendableFieldTypes}
              highlighted={item.id === highlightItemId}
            />
          ))
        )}
      </ul>
    </section>
  );
}
