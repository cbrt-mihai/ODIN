import { DocLink, DocProse } from "@/components/docs/doc-prose";

export function InvestigationDoc() {
  return (
    <DocProse>
      <h2>Investigation visuals</h2>
      <p>
        Visual summaries help you spot patterns, copy indicators, and see how
        evidence is distributed across a scope.
      </p>

      <h3>Where they appear</h3>
      <ul>
        <li>
          <DocLink href="/">Dashboard</DocLink> — 30-day activity sparkline and
          case status breakdown
        </li>
        <li>
          <DocLink href="/entities">Entity</DocLink> pages — indicators and
          confidence for that profile, plus a timeline map of its events
        </li>
        <li>
          <DocLink href="/cases">Case</DocLink> and{" "}
          <DocLink href="/groups">group</DocLink> pages — full investigation
          panel when entities are linked
        </li>
      </ul>

      <h3>Investigation insights panel</h3>
      <p>On cases and groups with linked entities, the collapsible panel includes:</p>
      <ul>
        <li>
          <strong>Timeline map</strong> — horizontal view of case and entity
          events; hover dots for details
        </li>
        <li>
          <strong>Extracted indicators</strong> — emails, domains, URLs, and
          phones scraped from entity text (click any chip to copy)
        </li>
        <li>
          <strong>Entity types</strong> — bar chart of person / organization /
          domain / general counts in scope
        </li>
        <li>
          <strong>Confidence breakdown</strong> — how many fields use each
          confidence level
        </li>
        <li>
          <strong>Relationship hubs</strong> — most connected entities within
          the scope (useful for pivoting)
        </li>
      </ul>

      <h3>Relationship graph</h3>
      <p>
        Use <strong>Graph</strong> in the sidebar for the full workspace graph.
        Entity, case, and group pages show a <em>scoped</em> graph only (that
        entity&apos;s neighborhood, or links between members of the case/group).
        The insights panel hub chart lists the most connected entities in scope;
        it is not the interactive graph.
      </p>
    </DocProse>
  );
}
