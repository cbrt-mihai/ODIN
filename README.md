# TheBlacklist

Local OSINT workspace built with Next.js. All investigation data is stored as JSON under `data/` (gitignored).

## Features

- **Entities** — person, organization, domain, and general types with flexible sections and typed fields (text, markdown, dates, location, links, images, and more)
- **Context, notes & proof** — per-field and per-entity context blocks, investigation notes, and structured evidence items
- **Confidence & validity** — per-field confidence (Inferred, Deduced, Unsure, Sure, Debunked) and date ranges
- **Cases** — group entities, statuses (active / archived / closed), Obsidian markdown descriptions, timelines, linked tools and resources, playbooks with step progress
- **Groups** — cross-case collections of entities with investigation insights and relationship views
- **Relationships** — typed edges, entity-link fields, wikilinks, backlinks, and interactive graphs on entity and case pages
- **Tools & resources** — external links and internal reference pages (markdown or HTML)
- **Inbox** — quick capture (text, URL, image) and triage into entity fields
- **Playbooks** — reusable checklists with optional tool/resource links; progress tracked per case
- **Investigation visuals** — timeline maps, IOC extraction, confidence/type charts, relationship hubs, dashboard activity sparkline
- **Snapshots** — save and restore entity versions under `data/snapshots/`
- **Trash** — soft-delete entities, cases, groups, tools, resources, and playbooks with restore
- **Duplicate detection & merge** — name/email/phone matching with section-level merge choices
- **HTML & PDF reports** — export from entity and case pages
- **Uploads** — gallery (folders, URL or file) and attachments with SHA-256
- **Saved views** — save list filters on entities, cases, groups, tools, resources, and inbox; pin items to the dashboard
- **Import / export** — full ZIP backup with conflict-aware import wizard; case-scoped ZIP export/import
- **Internal references** — `@entity.section.field` dot paths, Insert Reference picker, case/field backlinks
- **Review duplicates** — workspace-wide duplicate scan at `/duplicates`
- **Activity log** — audit of creates, updates, deletes, merges, and imports
- **Command palette** — `⌘K` / `Ctrl+K` global search
- **User guide** — in-app documentation at `/docs`
- **Workspace graph** — full relationship map at `/graph` with filters, force layout, and case/group coloring
- **Profile images** — optional avatars for entities, cases, and groups (upload, URL, or from entity gallery)
- **Customizable layout** — reorder entity/case panels, 1–4 column layout, optional wide workspace width

## Customization

- **Wide workspace** — toggle at the top of the main content area (desktop) to use a wider max width; stored in the browser.
- **Entity & case panels** — on detail pages, choose **1–4 columns**, drag vertical bars to resize column width and horizontal bars to resize panel height, and reorder panels via **Customize layout**. Preferences are saved locally per page type.
- **Profile images** — edit an entity, case, or group to upload or link a profile image. Uploads live under `data/uploads/{entityId}/profile/`, `data/uploads/cases/{id}/profile/`, or `data/uploads/groups/{id}/profile/`.
- **Insert Reference** — available in markdown and Obsidian-flavored text fields; inserts `@` paths and wikilinks from a searchable picker.
- See the in-app guide at [/docs/customization](http://localhost:3000/docs/customization) for details.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Browse the **User guide** from the sidebar or at [http://localhost:3000/docs](http://localhost:3000/docs).

### Demo data

Populate the workspace with a realistic sample investigation (Operation Glass Desk — credential phishing against a fictional analytics vendor):

```bash
npm run seed:mock
```

Use `npm run seed:mock -- --keep` to seed shared JSON files while keeping any existing entity/case/group files on disk. After seeding, start from **Operation Glass Desk** on the Cases page or **Elena Vasquez** on Entities.

## Data layout

```
data/
  settings.json
  tools.json
  resources.json
  relationships.json
  inbox.json
  playbooks.json
  activity.json
  saved-views.json
  entities/{id}.json
  cases/{id}.json
  groups/{id}.json
  trash/                 index.json + soft-deleted payloads
  snapshots/{entityId}/    Entity version history
  uploads/{entityId}/      Gallery, attachments, profile
  uploads/cases/{id}/profile/
  uploads/groups/{id}/profile/
  backups/               Auto-backups before import (optional)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run seed:mock` | Load sample investigation data under `data/` |

## Roadmap

Script run history, full Obsidian embeds, encrypted export, follow-up reminders, auto-backup scheduling.
