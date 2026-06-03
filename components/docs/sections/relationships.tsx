import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function RelationshipsDoc() {
  return (
    <DocProse>
      <h2>Relationships</h2>
      <p>
        Entities connect in several ways. The platform keeps typed relationships,
        field-level entity links, and Obsidian wikilinks in sync in the UI.
      </p>

      <h3>Typed relationships</h3>
      <p>
        On an entity page, use <strong>Add relationship</strong> to link to
        another entity with a type (e.g. Employed by, Owns). Types and their
        inverse phrases (e.g. Owns → Owned by) are defined in{" "}
        <DocLink href="/settings">Settings</DocLink>. Each link can include a
        date range and confirmation level. Remove or edit a link from the linked
        entities panel.
      </p>
      <p>
        Relationships read naturally from both sides: if Elena V. Vasquez{" "}
        <strong>Owns</strong> elena.dev, the domain page shows{" "}
        <strong>Owned by Elena V. Vasquez</strong> — not the same outgoing
        phrase reversed.
      </p>

      <h3>Entity link fields</h3>
      <p>
        Add a <strong>Link to entity</strong> field inside any section. The value
        points at another profile and shows as a card in view mode.
      </p>

      <h3>Internal references (@ dot paths)</h3>
      <p>
        Reference entities, cases, and fields with dot-separated paths:{" "}
        <code>@elena-vasquez</code>, <code>@elena-vasquez.contact.work-email</code>,{" "}
        <code>@operation-glass-desk.description</code>. Use bare{" "}
        <code>@path</code> in markdown, <code>[[@path]]</code>, or{" "}
        <code>[[Label|@path]]</code> for aliased links. The{" "}
        <strong>Insert reference</strong> button in markdown editors builds these
        for you, or type <code>@[</code> in any markdown field to open the same
        wizard.
      </p>
      <p>
        Legacy wikilinks (<code>[[Display Name]]</code>, <code>[[slug]]</code>) still
        work. Field and case backlinks appear in the linked entities panel.
      </p>

      <h3>Wikilinks in markdown</h3>
      <p>
        In markdown fields, use <code>[[Display Name]]</code>, <code>[[slug]]</code>,
        or <code>[[person:entity-id]]</code> to reference entities. Links resolve in
        previews and readonly views.
      </p>

      <h3>Backlinks</h3>
      <p>
        The <strong>Linked entities</strong> panel lists relationships (with
        correct phrasing for this profile), backlinks from other entities&apos;
        link fields, and backlinks from wikilinks in their notes.
      </p>

      <h3>Graph view</h3>
      <p>
        <DocLink href="/graph">Graph</DocLink> in the sidebar opens the full
        workspace graph. Each entity, case, and{" "}
        <DocLink href="/groups">group</DocLink> page shows a scoped graph only:
        the entity&apos;s relationship neighborhood, or links between members of
        that case or group. Use <strong>Open workspace graph</strong> on a scoped
        graph to jump to the full view centered on that entity.
      </p>
    </DocProse>
  );
}
