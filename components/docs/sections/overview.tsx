import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function OverviewDoc() {
  return (
    <DocProse>
      <h2>Welcome to TheBlacklist</h2>
      <p>
        TheBlacklist is a <strong>local-only OSINT workspace</strong> for
        organizing people, organizations, domains, and other subjects under
        investigation. Everything is stored as JSON files on your machine — no
        database and no cloud account.
      </p>

      <h3>What you can do</h3>
      <ul>
        <li>
          Build <DocLink href="/entities">entity profiles</DocLink> with
          flexible sections, typed fields, images, and attachments
        </li>
        <li>
          Group work into <DocLink href="/cases">cases</DocLink> with
          timelines, relationship graphs, and playbooks
        </li>
        <li>
          Organize cross-case rosters with{" "}
          <DocLink href="/groups">groups</DocLink> and scoped investigation
          insights
        </li>
        <li>
          Bookmark <DocLink href="/tools">tools</DocLink> and{" "}
          <DocLink href="/resources">resources</DocLink> (external sites or
          internal reference pages)
        </li>
        <li>
          Capture raw notes in the <DocLink href="/inbox">inbox</DocLink> and
          triage them into structured fields
        </li>
        <li>
          <DocLink href="/import-export">Export and import</DocLink> your full{" "}
          <code>data/</code> folder as ZIP backups
        </li>
      </ul>

      <h3>Getting started</h3>
      <ol>
        <li>
          Run <code>npm run seed:mock</code> for a sample investigation dataset, or
          open <DocLink href="/entities">Entities</DocLink> and create your first
          profile (person, organization, domain, or general).
        </li>
        <li>
          Optional: create a <DocLink href="/cases">case</DocLink> and link
          entities to keep investigations separate.
        </li>
        <li>
          Optional: create a <DocLink href="/groups">group</DocLink> for a
          roster that spans cases.
        </li>
        <li>
          Visit <DocLink href="/settings">Settings</DocLink> to tune confidence
          types, field types, and entity templates for new profiles.
        </li>
        <li>
          Press <strong>⌘K</strong> (or <strong>Ctrl+K</strong>) anywhere to
          search and jump quickly — see{" "}
          <DocLink href="/docs/shortcuts">Shortcuts</DocLink>.
        </li>
      </ol>

      <h3>Local & private</h3>
      <p>
        The app is designed for <strong>localhost use</strong>. Do not expose
        it to the public internet without adding your own authentication. Your
        investigation data never leaves your disk unless you export it. See{" "}
        <DocLink href="/docs/data">Your data</DocLink> for the file layout.
      </p>
    </DocProse>
  );
}
