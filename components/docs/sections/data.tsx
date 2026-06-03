import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function DataDoc() {
  return (
    <DocProse>
      <h2>Your data</h2>
      <p>
        All investigation data lives in the <code>data/</code> folder at the
        project root (gitignored by default). There is no database — the app reads
        and writes JSON and files directly.
      </p>

      <h3>Layout</h3>
      <pre className="mb-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-400">
{`data/
  settings.json          Platform configuration
  tools.json             Tool catalog
  resources.json         Resource catalog
  relationships.json     Entity-to-entity edges
  inbox.json             Quick capture queue
  playbooks.json         Checklist templates
  activity.json          Change log
  saved-views.json       Saved list filters (all pages)
  trash/                 Soft-deleted items (index.json + payloads)
  entities/{id}.json     One file per profile
  cases/{id}.json        One file per case
  groups/{id}.json       One file per group
  snapshots/{entityId}/  Entity version history
  uploads/{entityId}/    Gallery images & attachments
  runs/                  Reserved for future script run history`}
      </pre>

      <h3>Writes</h3>
      <p>
        Updates use atomic writes (temp file + rename) to reduce the risk of
        corrupted JSON if the process is interrupted.
      </p>

      <h3>Backups</h3>
      <p>
        Copy the entire <code>data/</code> folder or use{" "}
        <DocLink href="/import-export">Import / Export</DocLink> in the app. For
        case-specific handoffs, use case ZIP export from the case page.
      </p>

      <h3>Demo data</h3>
      <p>
        From the project root, run <code>npm run seed:mock</code> to load a
        sample investigation (Operation Glass Desk): persons, org, legitimate and
        typosquat domains, a phishing kit artifact, inbox items, playbooks,
        groups, trash entries, uploads, snapshots, and a CRM duplicate for merge
        testing. Pass <code>--keep</code> to avoid deleting existing entity,
        case, or group JSON files before seeding.
      </p>

      <h3>Development</h3>
      <p>
        Run <code>npm install</code> then <code>npm run dev</code> and open{" "}
        <code>http://localhost:3000</code>. See the project README for setup and
        script reference.
      </p>
    </DocProse>
  );
}
