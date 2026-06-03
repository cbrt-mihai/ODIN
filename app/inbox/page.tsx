import { Suspense } from "react";
import { InboxCaptureForm } from "@/components/inbox/inbox-capture-form";
import { InboxItemHighlight } from "@/components/inbox/inbox-item-highlight";
import { InboxSection } from "@/components/inbox/inbox-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listEntities } from "@/lib/actions/entities";
import { listInboxItems } from "@/lib/actions/inbox";
import { APPENDABLE_INBOX_FIELD_TYPE_IDS } from "@/lib/inbox/appendable-field-types";
import { getSettings } from "@/lib/storage";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const highlightItemId =
    typeof params.item === "string"
      ? params.item
      : Array.isArray(params.item)
        ? params.item[0]
        : undefined;

  const [items, entities, settings] = await Promise.all([
    listInboxItems(),
    listEntities(),
    getSettings(),
  ]);
  const appendableFieldTypes = settings.fieldTypes
    .filter((ft) => ft.enabled && APPENDABLE_INBOX_FIELD_TYPE_IDS.has(ft.id))
    .sort((a, b) => a.order - b.order);

  const pending = items.filter((i) => i.status === "pending");
  const triaged = items.filter((i) => i.status === "triaged");
  const archived = items.filter((i) => i.status === "archived");

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <InboxItemHighlight />
      </Suspense>
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="mt-1 text-sm text-zinc-400">Quick capture during research.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capture</CardTitle>
        </CardHeader>
        <CardContent>
          <InboxCaptureForm />
        </CardContent>
      </Card>

      <InboxSection
        title="Pending"
        description="Items waiting to be triaged or archived."
        items={pending}
        entities={entities}
        appendableFieldTypes={appendableFieldTypes}
        emptyMessage="Nothing pending — capture something above."
        highlightItemId={highlightItemId}
      />

      {(triaged.length > 0 || archived.length > 0) && (
        <div className="space-y-8 border-t border-zinc-800 pt-8">
          {triaged.length > 0 && (
            <InboxSection
              title="Triaged"
              description="Appended to entity fields. Open the entity to review."
              items={triaged}
              entities={entities}
              appendableFieldTypes={appendableFieldTypes}
              emptyMessage="No triaged items."
              highlightItemId={highlightItemId}
            />
          )}
          {archived.length > 0 && (
            <InboxSection
              title="Archived"
              description="Marked done without attaching to structured data."
              items={archived}
              entities={entities}
              appendableFieldTypes={appendableFieldTypes}
              emptyMessage="No archived items."
              highlightItemId={highlightItemId}
            />
          )}
        </div>
      )}
    </div>
  );
}
