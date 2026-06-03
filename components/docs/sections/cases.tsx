import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function CasesDoc() {
  return (
    <DocProse>
      <h2>Cases</h2>
      <p>
        A <strong>case</strong> is an investigation workspace. Use cases to
        separate unrelated targets, keep entity rosters scoped, and attach
        timelines and playbooks to one thread of work.
      </p>

      <h3>Create and manage</h3>
      <ul>
        <li>
          Add cases from the <DocLink href="/cases">Cases</DocLink> page with a
          title and optional description (Obsidian-style markdown supported).
        </li>
        <li>
          Set status to <strong>active</strong>, <strong>archived</strong>, or{" "}
          <strong>closed</strong>. Filter the case list by status.
        </li>
        <li>
          Link entities from the case page or from each entity&apos;s membership
          panel.
        </li>
        <li>
          Link related cases from the <strong>Linked cases</strong> panel (bidirectional).
        </li>
        <li>
          Link one or more <DocLink href="/groups">groups</DocLink> from the{" "}
          <strong>Linked groups</strong> panel (bidirectional).
        </li>
        <li>
          Attach <DocLink href="/tools">tools</DocLink> and{" "}
          <DocLink href="/resources">resources</DocLink> as quick references for
          this investigation.
        </li>
      </ul>

      <h3>Timeline</h3>
      <p>
        Add dated events on the case timeline: title, time, optional end time,
        type, description, and linked entities. Edit or delete events inline.
        Event types are configurable in <DocLink href="/settings">Settings</DocLink>.
      </p>

      <h3>Investigation insights</h3>
      <p>
        When entities are linked, an <strong>Investigation insights</strong>{" "}
        panel summarizes the scope: timeline map (case + entity events),
        extracted indicators (emails, domains, URLs, phones), entity type and
        confidence charts, and relationship hub rankings. See{" "}
        <DocLink href="/docs/investigation">Investigation visuals</DocLink>.
      </p>

      <h3>Relationship graph</h3>
      <p>
        The case page includes a graph of all linked entities and their
        relationships. Click a node to open that entity.
      </p>

      <h3>Playbooks on a case</h3>
      <p>
        Attach a <DocLink href="/playbooks">playbook</DocLink> to track checklist
        progress for this investigation. See the Playbooks guide for details.
      </p>

      <h3>Export</h3>
      <ul>
        <li>
          <strong>HTML / PDF reports</strong> — full case data: description, linked
          cases and entities, relationships, timeline, tools, resources, playbooks,
          and per-entity detail.
        </li>
        <li>
          <strong>Export ZIP</strong> — case file, linked entities,
          relationships, and their uploads (case-scoped backup).
        </li>
      </ul>
    </DocProse>
  );
}
