import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function CustomizationDoc() {
  return (
    <DocProse>
      <h2>Customization</h2>
      <p>
        TheBlacklist keeps layout and appearance choices on your machine. Nothing
        here changes investigation data unless noted.
      </p>

      <h3>Workspace width</h3>
      <p>
        On desktop, use the width control at the top of the main content area to
        cycle through <strong>Standard width</strong>,{" "}
        <strong>Wide workspace</strong>, and{" "}
        <strong>Widest workspace</strong>. Widest uses nearly the full main panel
        with minimal side padding. Your choice is stored in the browser.
      </p>

      <h3>Panel layout (entity &amp; case pages)</h3>
      <p>
        Below the main editor on entity and case detail pages, investigation
        panels (timeline, graph, duplicates, and so on) can use{" "}
        <strong>1–4 columns</strong>. Panels fill columns in order from left to
        right. Click <strong>Customize layout</strong> to reorder them by
        drag-and-drop. Column count and order are saved per scope (entity vs
        case) in local storage.
      </p>

      <h3>Profile images</h3>
      <p>
        Entities, cases, and groups can have an optional profile image (upload or
        URL). Images are stored under{" "}
        <code>data/uploads/…/profile/</code> for uploads. Entity profiles can also
        be set from an existing gallery image while editing.
      </p>

      <h3>Insert Reference</h3>
      <p>
        Markdown fields and Obsidian-flavored text fields include an{" "}
        <strong>Insert reference</strong> control. It inserts{" "}
        <code>@entity.section.field</code> paths, entity wikilinks, and case
        references without typing paths by hand. See{" "}
        <DocLink href="/docs/entities">Entities</DocLink> for path syntax.
      </p>

      <h3>Relationship graph</h3>
      <p>
        The workspace graph at <DocLink href="/graph">Graph</DocLink> supports
        filters, gravity on/off, color-by-case, and cluster-by-group. Entity,
        case, and group pages show scoped graphs only.
      </p>
    </DocProse>
  );
}
