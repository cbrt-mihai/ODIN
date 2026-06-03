import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function InboxDoc() {
  return (
    <DocProse>
      <h2>Inbox</h2>
      <p>
        The inbox is a <strong>quick capture</strong> queue for URLs, text, and
        image references gathered during research before you structure them.
      </p>

      <h3>Capture</h3>
      <p>
        Add items on the <DocLink href="/inbox">Inbox</DocLink> page. Each item
        has a content type (<strong>text</strong>, <strong>url</strong>, or{" "}
        <strong>image</strong> — image stores a URL to the asset). Items start in{" "}
        <strong>Pending</strong> until you triage or archive them. Triaged and
        archived items appear in separate sections below.
      </p>

      <h3>Triage options</h3>
      <ul>
        <li>
          <strong>Triage to field</strong> — pick an entity and section, then
          choose an existing appendable field (and edit its label if needed) or
          create a new field. Content is appended with a separator.
        </li>
        <li>
          <strong>New entity</strong> — create a person/org/domain/general profile
          and append the inbox content into its first suitable notes field.
        </li>
        <li>
          <strong>Archive</strong> — mark done without attaching to structured
          data.
        </li>
        <li>
          <strong>Delete</strong> — remove the item permanently.
        </li>
      </ul>

      <h3>Appendable field types</h3>
      <p>
        Triage can target short text, long text, rich markdown, Obsidian markdown,
        URL, email, and phone fields.
      </p>

      <h3>Saved views</h3>
      <p>
        Filter by status (pending, triaged, archived) and save the filter as a
        named view for quick access later.
      </p>
    </DocProse>
  );
}
