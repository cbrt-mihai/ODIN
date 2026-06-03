import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function SettingsDoc() {
  return (
    <DocProse>
      <h2>Settings</h2>
      <p>
        Platform-wide defaults live in <code>data/settings.json</code> and are
        edited on the <DocLink href="/settings">Settings</DocLink> page.
      </p>

      <h3>Theme</h3>
      <p>Choose dark, light, or system appearance.</p>

      <h3>Entity types</h3>
      <p>
        Add, remove, enable, or disable entity kinds in your catalog. Customize
        labels and chart colors. Removing a type from settings does not change
        existing entities — profiles keep their stored type and the app shows a
        generated label and color for those archived kinds. Disabled types are
        hidden from the new-entity form; types still in use but removed from the
        catalog appear in list filters as &quot;removed from catalog&quot;.
      </p>

      <h3>Export / import settings</h3>
      <p>
        Download or upload a JSON file with your settings only (not entities or
        cases). After import, click <strong>Save settings</strong> to persist.
        Use <DocLink href="/import-export">Import / Export</DocLink> for a full
        workspace ZIP.
      </p>

      <h3>Field types</h3>
      <p>
        Enable or disable which field types appear when adding fields to entities.
        Disabled types remain on existing fields but cannot be chosen for new
        ones.
      </p>

      <h3>Confidence types</h3>
      <p>
        Customize labels, colors, and terminal (debunked) behavior. Add or remove
        types; every field must have a confidence value.
      </p>

      <h3>Relationship types</h3>
      <p>
        In <strong>Advanced settings</strong>, define preset labels for typed
        relationships between entities (e.g. employed_by, associated_with) and
        which entity types they apply to.
      </p>

      <h3>Timeline event types</h3>
      <p>
        Tags available when adding events to cases or entities (observation,
        contact, legal, digital, etc.).
      </p>

      <h3>Entity templates</h3>
      <p>
        For each entity type, edit the default <strong>section titles</strong>{" "}
        applied when creating a new profile. New sections start empty; add fields
        after creation.
      </p>

      <h3>Tool and resource categories</h3>
      <p>
        Category strings in <code>settings.json</code> under{" "}
        <code>categories.tools</code> and <code>categories.resources</code> are
        used as suggestions when editing tool and resource entries (datalist on
        the Tools and Resources pages). They are not edited in the Settings UI
        today — adjust the JSON directly or re-seed demo data.
      </p>

      <p>
        Click <strong>Save settings</strong> to persist changes to disk.
      </p>
    </DocProse>
  );
}
