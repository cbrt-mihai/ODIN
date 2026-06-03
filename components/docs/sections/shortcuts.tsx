import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function ShortcutsDoc() {
  return (
    <DocProse>
      <h2>Shortcuts</h2>

      <h3>Command palette — ⌘K / Ctrl+K</h3>
      <p>
        Opens global search across entities, cases, tools, resources, inbox, and
        field text. With an empty query, quick links include:
      </p>
      <ul>
        <li>Entities, Cases, Groups, Inbox</li>
        <li>Import / Export, Activity, Trash</li>
        <li>Jump to common destinations</li>
      </ul>
      <p>
        You can also click the <strong>Search</strong> button at the bottom-right
        of the screen.
      </p>

      <h3>Saved views</h3>
      <p>
        On list pages — <DocLink href="/entities">Entities</DocLink>,{" "}
        <DocLink href="/cases">Cases</DocLink>, <DocLink href="/groups">Groups</DocLink>,{" "}
        <DocLink href="/tools">Tools</DocLink>, <DocLink href="/resources">Resources</DocLink>, and{" "}
        <DocLink href="/inbox">Inbox</DocLink> — apply filters and sort, then save
        the current state as a named view. Click a saved view to restore those
        filters via the URL. Views are stored in <code>data/saved-views.json</code>.
      </p>
      <p>
        Mark a view as <strong>pinned</strong> when saving (or edit in the saved
        views list) to show it on the <DocLink href="/">dashboard</DocLink>{" "}
        pinned section. Pinning a specific entity, case, or tool opens that record
        directly.
      </p>

      <h3>Pin to dashboard</h3>
      <p>
        From an entity page, <strong>Pin to dashboard</strong> creates a pinned
        saved view filtered to that entity — the same mechanism as saved views
        above.
      </p>
    </DocProse>
  );
}
