import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function PlaybooksDoc() {
  return (
    <DocProse>
      <h2>Playbooks</h2>
      <p>
        Playbooks are <strong>reusable checklists</strong> for common OSINT
        workflows (e.g. person baseline, domain review).
      </p>

      <h3>Templates</h3>
      <ul>
        <li>
          Create playbooks on the <DocLink href="/playbooks">Playbooks</DocLink>{" "}
          page with a title and ordered steps.
        </li>
        <li>
          Edit a step to add a description and optional links to a tool or
          resource.
        </li>
        <li>
          Remove steps or delete entire playbooks when no longer needed.
        </li>
      </ul>

      <h3>On a case</h3>
      <p>
        From a <DocLink href="/cases">case</DocLink>, attach one or more
        playbooks and check off steps as you go. Progress is stored on the case
        (<code>playbookProgress</code> in the case file), not on the template.
        Multiple playbooks can run in parallel on one case.
      </p>

      <h3>Trash</h3>
      <p>
        Deleting a playbook removes it from active lists and moves the template
        to <DocLink href="/trash">Trash</DocLink>. Restoring returns it to the
        playbook catalog; permanently deleting drops the template file.
      </p>
    </DocProse>
  );
}
