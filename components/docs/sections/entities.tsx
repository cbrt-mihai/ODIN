import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function EntitiesDoc() {
  return (
    <DocProse>
      <h2>Entities</h2>
      <p>
        An entity is anything you investigate: a person, organization, domain,
        or a general catch-all (events, documents, locations, etc.). Each entity
        has a profile made of <strong>sections</strong> and <strong>fields</strong>.
      </p>

      <h3>Entity types</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Typical use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Person</td>
            <td>Individuals — contact, social, employment sections</td>
          </tr>
          <tr>
            <td>Organization</td>
            <td>Companies, groups, registrants</td>
          </tr>
          <tr>
            <td>Domain</td>
            <td>Hostnames — WHOIS, DNS, hosting</td>
          </tr>
          <tr>
            <td>General</td>
            <td>Artifacts, kits, or anything that does not fit the above</td>
          </tr>
        </tbody>
      </table>
      <p>
        Use <DocLink href="/people">People</DocLink> as a shortcut to the entity
        list filtered to persons only.
      </p>

      <h3>Profile image</h3>
      <p>
        While editing an entity, set a profile image via upload, URL, or an
        existing gallery image. It appears in lists and on the entity header.
        Uploads are stored under <code>data/uploads/&#123;entityId&#125;/profile/</code>.
      </p>

      <h3>Sections and fields</h3>
      <ul>
        <li>
          <strong>Sections</strong> group related facts (e.g. Contact, Notes).
          Add, rename, or remove sections in edit mode.
        </li>
        <li>
          <strong>Fields</strong> hold one piece of intelligence. Choose a field
          type when adding (see table below).
        </li>
        <li>
          Toggle <strong>view mode</strong> on an entity to read without edit
          controls.
        </li>
      </ul>

      <h3>Field types</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Use for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Short / long text</td>
            <td>Plain or multi-line text; short text can render URLs and wikilinks</td>
          </tr>
          <tr>
            <td>Rich / Obsidian markdown</td>
            <td>Formatted notes with GFM and <code>[[wikilinks]]</code></td>
          </tr>
          <tr>
            <td>URL, email, phone</td>
            <td>Typed contact and link values</td>
          </tr>
          <tr>
            <td>Number</td>
            <td>Numeric facts (counts, scores)</td>
          </tr>
          <tr>
            <td>Date, date &amp; time</td>
            <td>Single points in time</td>
          </tr>
          <tr>
            <td>Date range, multiple dates</td>
            <td>Spans with known/unknown bounds; lists of dated events</td>
          </tr>
          <tr>
            <td>Location</td>
            <td>Label, address, coordinates, map link</td>
          </tr>
          <tr>
            <td>Yes / No, dropdown, checklist, tags</td>
            <td>Structured choices and tag lists</td>
          </tr>
          <tr>
            <td>Image</td>
            <td>URL or uploaded image reference</td>
          </tr>
          <tr>
            <td>Link to entity</td>
            <td>Pointer to another profile in the workspace</td>
          </tr>
        </tbody>
      </table>
      <p>
        Enable or disable types for <em>new</em> fields in{" "}
        <DocLink href="/settings">Settings</DocLink>. After running{" "}
        <code>npm run seed:mock</code>, see the <strong>support-northline.com</strong>{" "}
        domain profile for a realistic mix of field types in one investigation.
      </p>

      <h3>Confidence and validity</h3>
      <p>
        Every field has a <strong>confidence</strong> level (Inferred, Deduced,
        Unsure, Sure, Debunked by default). Debunked fields appear muted and
        struck through. On proof/source metadata, set a <strong>valid period</strong>
        with the same bound types as date-range fields (known/unknown/present,
        including unknown–unknown with a known middle date) — separate from when
        you collected it.
      </p>
      <p>
        Expand field metadata to record <strong>source & provenance</strong>{" "}
        (source name, URL, collection date), <strong>context</strong> and{" "}
        <strong>notes</strong> entries, and <strong>proof</strong> items (links,
        documents, screenshots, witness statements, analysis, etc.). Entity-wide
        provenance and proof are available at the profile level too.
      </p>

      <h3>Entity context and notes</h3>
      <p>
        Above the sections, add typed <strong>context</strong> blocks (overview,
        background, hypothesis, caveats) and <strong>investigation notes</strong>{" "}
        (open questions, interviews, internal workflow). These support markdown
        or Obsidian flavor where configured.
      </p>

      <h3>Gallery and attachments</h3>
      <ul>
        <li>
          <strong>Gallery</strong> — organize images in folders; add via upload
          or URL with SHA-256 hashes for uploaded files.
        </li>
        <li>
          <strong>Attachments</strong> — PDFs, documents, and other files under{" "}
          <code>data/uploads/{`{entityId}`}/attachments/</code>.
        </li>
        <li>
          Gallery and attachment items can have their own context, notes, and
          proof panels.
        </li>
      </ul>

      <h3>Entity timeline</h3>
      <p>
        Add dated events on the entity timeline (title, time, optional end time,
        type, description). These feed the entity timeline map in investigation
        insights and appear on linked <DocLink href="/cases">cases</DocLink> when
        scoped together.
      </p>

      <h3>Duplicates and merge</h3>
      <p>
        When creating an entity, similar names (and matching email/phone fields)
        trigger a <strong>possible duplicates</strong> warning. On an entity
        page, the merge panel lists candidates — combine two records by choosing
        how overlapping sections merge and which field values to keep.
      </p>

      <h3>Snapshots</h3>
      <p>
        Save a <strong>snapshot</strong> before major edits or merges. Restore an
        older version from the snapshots panel (the current state is snapshotted
        automatically before restore). Files live under{" "}
        <code>data/snapshots/{`{entityId}`}/</code>.
      </p>

      <h3>Reports and pins</h3>
      <p>
        Export <strong>HTML</strong> or <strong>PDF</strong> reports from the
        entity header (debunked fields are omitted). Use <strong>Pin to
        dashboard</strong> to add a saved view that appears on the{" "}
        <DocLink href="/">dashboard</DocLink> pinned section.
      </p>
    </DocProse>
  );
}
