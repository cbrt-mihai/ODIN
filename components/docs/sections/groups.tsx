import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function GroupsDoc() {
  return (
    <DocProse>
      <h2>Groups</h2>
      <p>
        A <strong>group</strong> is a named collection of entities that may span
        multiple <DocLink href="/cases">cases</DocLink>. Use groups when you want
        a stable roster (e.g. a corporate cluster or a set of key persons)
        without tying membership to a single investigation file.
      </p>

      <h3>Create and manage</h3>
      <ul>
        <li>
          Add groups from the <DocLink href="/groups">Groups</DocLink> page with
          a title, optional description, color, and tags.
        </li>
        <li>
          Link and unlink entities from the group page or from each entity&apos;s
          membership panel.
        </li>
        <li>
          Link groups to one or more cases (and vice versa), or link related
          groups to each other — same bidirectional pattern as linked cases.
        </li>
        <li>
          Search, sort, and filter the group list; save filters as{" "}
          <DocLink href="/docs/shortcuts">saved views</DocLink>.
        </li>
      </ul>

      <h3>Investigation insights</h3>
      <p>
        When a group has linked entities, the same{" "}
        <DocLink href="/docs/investigation">investigation insights</DocLink> panel
        used on cases appears: timeline map, extracted indicators, entity type
        and confidence charts, and relationship hub rankings for that scope.
      </p>

      <h3>Relationship graph</h3>
      <p>
        The group page includes a graph of member entities and their
        relationships. Click a node to open that entity profile.
      </p>

      <h3>Trash</h3>
      <p>
        Deleting a group moves it to <DocLink href="/trash">Trash</DocLink> and
        removes the group from member entities, linked cases, and related
        groups. Restore from Trash to re-link members automatically.
      </p>
    </DocProse>
  );
}
