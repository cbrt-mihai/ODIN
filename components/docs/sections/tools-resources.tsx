import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function ToolsResourcesDoc() {
  return (
    <DocProse>
      <h2>Tools & resources</h2>
      <p>
        Catalog OSINT sites, cheat sheets, and internal notes in one place. Tools
        and resources share the same kinds — only the section name differs.
      </p>

      <h3>Kinds</h3>
      <table>
        <thead>
          <tr>
            <th>Kind</th>
            <th>Behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>External</td>
            <td>Opens a URL in a new tab (classic bookmark)</td>
          </tr>
          <tr>
            <td>Internal page</td>
            <td>
              Reference page inside the app at <code>/tools/[id]</code> or{" "}
              <code>/resources/[id]</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Internal page formats</h3>
      <ul>
        <li>
          <strong>Markdown</strong> — Rich GFM or Obsidian flavor with live
          preview and wikilink support.
        </li>
        <li>
          <strong>HTML</strong> — Raw HTML body for formatted reference material
          (resources only).
        </li>
      </ul>

      <h3>Managing entries</h3>
      <ul>
        <li>
          Add, edit, or delete from the <DocLink href="/tools">Tools</DocLink> or{" "}
          <DocLink href="/resources">Resources</DocLink> list.
        </li>
        <li>
          Filter by kind (All / External / Internal page), category, and tags;
          save list state as a <DocLink href="/docs/shortcuts">saved view</DocLink>.
        </li>
        <li>
          Deleted entries move to <DocLink href="/trash">Trash</DocLink> and can
          be restored.
        </li>
      </ul>

      <h3>On cases</h3>
      <p>
        Link tools and resources from a <DocLink href="/cases">case</DocLink> page
        so investigators open the right references while working that
        investigation.
      </p>

      <h3>Playbook links</h3>
      <p>
        Playbook steps can link to a tool or resource so investigators open the
        right reference while working through a checklist.
      </p>
    </DocProse>
  );
}
