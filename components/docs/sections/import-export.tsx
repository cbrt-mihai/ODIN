import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function ImportExportDoc() {
  return (
    <DocProse>
      <h2>Import & export</h2>
      <p>
        Back up and move your workspace using ZIP archives of the entire{" "}
        <code>data/</code> directory.
      </p>

      <h3>Full export</h3>
      <p>
        On <DocLink href="/import-export">Import / Export</DocLink>, download a
        ZIP containing all JSON files, uploads, snapshots, trash payloads, and a
        manifest. Store backups on encrypted media if the data is sensitive.
      </p>

      <h3>Import (conflict-aware)</h3>
      <p>
        Upload a previously exported ZIP on{" "}
        <DocLink href="/import-export">Import / Export</DocLink>. The import wizard
        analyzes the archive first and shows new items vs conflicts. By default,
        existing files are <strong>not</strong> overwritten — you choose per-item
        actions (skip, overwrite, or import as copy with a new ID). Optional full
        backup is created before apply.
      </p>
      <p>
        Case-scoped ZIPs can be imported from the case page via{" "}
        <strong>Import case ZIP</strong>. Entity ID collisions require an explicit
        choice for each conflicting entity.
      </p>

      <h3>Case-scoped export & import</h3>
      <p>
        From a case page, use <strong>Export ZIP</strong> to download that case,
        its linked entities, related relationships, and entity uploads. Import the
        same ZIP back via <strong>Import case ZIP</strong> to merge into your
        workspace without replacing the entire <code>relationships.json</code> file.
      </p>

      <h3>Reports</h3>
      <ul>
        <li>
          <strong>Entity</strong> — HTML or PDF with sections, provenance, and
          relationships (debunked fields omitted).
        </li>
        <li>
          <strong>Case</strong> — HTML or PDF with full case data and linked entity
          detail.
        </li>
      </ul>

      <h3>Trash</h3>
      <p>
        Deleted entities, cases, groups, tools, resources, and playbooks move to{" "}
        <DocLink href="/trash">Trash</DocLink> (<code>data/trash/</code>) and can
        be restored or permanently removed. Restoring re-links entities to cases
        and groups as recorded in the trash payload.
      </p>

      <h3>Activity log</h3>
      <p>
        The <DocLink href="/activity">Activity</DocLink> page shows a recent
        audit of creates, updates, deletes, restores, merges, and imports stored
        in <code>data/activity.json</code>.
      </p>

      <h3>Erase all data</h3>
      <p>
        At the bottom of Import / Export, <strong>Erase all data</strong> wipes
        entities, cases, groups, uploads, inbox, tools, resources, relationships,
        playbooks, activity, saved views, snapshots, and trash — then resets{" "}
        <code>settings.json</code> to defaults. Type <code>ERASE ALL DATA</code> to
        confirm. Export a backup first; run <code>npm run seed:mock</code> afterward
        to reload the sample investigation.
      </p>
    </DocProse>
  );
}
