# ODIN

**Local-first OSINT workspace** for organizing people, organizations, domains, and other subjects under investigation.

Built with [Next.js](https://nextjs.org/). All investigation data lives as JSON and files under `data/` on your machine. No database, no cloud account, no telemetry. Your data never leaves disk unless you export it.

> **Privacy:** The app is designed for **localhost use**. Do not expose it to the public internet without adding your own authentication.

## Features

### Core workflow

- **Entities** — person, organization, domain, and general types with flexible sections and typed fields (text, markdown, dates, location, links, images, and more)
- **Cases** — group entities with statuses (active / archived / closed), Obsidian markdown descriptions, timelines, linked tools and resources, and playbooks with step progress
- **Groups** — cross-case collections of entities with investigation insights and relationship views
- **Inbox** — quick capture (text, URL, image) and triage into entity fields
- **Context, notes & proof** — per-field and per-entity context blocks, investigation notes, and structured evidence items
- **Confidence & validity** — per-field confidence (Inferred, Deduced, Unsure, Sure, Debunked) and date ranges

### Relationships & analysis

- **Relationships** — typed edges, entity-link fields, wikilinks, backlinks, and interactive graphs on entity and case pages
- **Workspace graph** — full relationship map at `/graph` with filters, force layout, gravity toggle, and case/group coloring
- **Investigation visuals** — timeline maps, IOC extraction, confidence/type charts, relationship hubs, dashboard activity sparkline
- **Duplicate detection & merge** — name/email/phone matching with section-level merge choices; workspace-wide scan at `/duplicates`
- **Internal references** — `@entity.section.field` dot paths, Insert Reference picker, case/field backlinks

### Tools & output

- **Tools & resources** — external links and internal reference pages (markdown or HTML)
- **Playbooks** — reusable checklists with optional tool/resource links; progress tracked per case
- **HTML & PDF reports** — export from entity and case pages
- **Snapshots** — save and restore entity versions under `data/snapshots/`
- **Uploads** — gallery (folders, URL or file) and attachments with SHA-256
- **Saved views** — save list filters on entities, cases, groups, tools, resources, and inbox; pin items to the dashboard
- **Import / export** — full ZIP backup with conflict-aware import wizard; case-scoped ZIP export/import
- **Trash** — soft-delete entities, cases, groups, tools, resources, and playbooks with restore
- **Activity log** — audit of creates, updates, deletes, merges, and imports

### UI

- **Command palette** — `⌘K` / `Ctrl+K` global search
- **User guide** — in-app documentation at `/docs`
- **Profile images** — optional avatars for entities, cases, and groups (upload, URL, or from entity gallery)
- **Customizable layout** — reorder entity/case panels, 1–4 column layout, optional wide workspace width for ultra-wide monitors

## Quick start

**Requirements:** Node.js 20+

```bash
git clone https://github.com/cbrt-mihai/ODIN.git
cd ODIN
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Browse the **User guide** from the sidebar or at [http://localhost:3000/docs](http://localhost:3000/docs).

### Demo data

Populate the workspace with a realistic sample investigation (Operation Glass Desk — credential phishing against a fictional analytics vendor):

```bash
npm run seed:mock
```

Use `npm run seed:mock -- --keep` to seed shared JSON files while keeping any existing entity/case/group files on disk. After seeding, start from **Operation Glass Desk** on the Cases page or **Elena Vasquez** on Entities.

### Production

```bash
npm run build
npm start
```

## Customization

Most platform defaults are edited on the **Settings** page and stored in `data/settings.json`.

| Area | Where | What you can change |
|------|-------|---------------------|
| **Relationship types** | Settings → Advanced | Outgoing label (e.g. *Owns*) and **incoming inverse** (e.g. *Owned by*) so backlinks read naturally on the target entity's page |
| **Per-link override** | Entity → Add relationship | Custom inverse text on a single link without changing the global type |
| **Confidence types** | Settings | Labels, colors, order, and terminal (debunked) behavior |
| **Entity types** | Settings | Catalog labels, chart colors, enable/disable for new profiles |
| **Field types** | Settings | Which field kinds appear when adding fields to entities |
| **Entity templates** | Settings → Advanced | Default section titles per entity type for new profiles |
| **Timeline event types** | Settings → Advanced | Tags for case and entity timeline events |
| **Tool/resource categories** | `settings.json` → `categories` | Suggestion strings for tool and resource datalists (edit JSON directly) |

**Layout & appearance** (stored in the browser, not in `data/`):

- **Workspace width** — cycle Standard → Wide → Widest at the top of the main content area (desktop). Widest mode uses nearly the full panel for ultra-wide monitors.
- **Entity & case panels** — choose **1–4 columns**, drag vertical bars to resize column width and horizontal bars to resize panel height, and reorder panels via **Customize layout**.
- **Profile images** — edit an entity, case, or group to upload or link a profile image. Uploads live under `data/uploads/{entityId}/profile/`, `data/uploads/cases/{id}/profile/`, or `data/uploads/groups/{id}/profile/`.
- **Insert Reference** — available in markdown and Obsidian-flavored text fields; inserts `@` paths and wikilinks from a searchable picker. Type `@[` in any markdown field to open the wizard.

Export or import settings alone (without entities) from Settings. For a full workspace backup, use **Import / Export** in the app.

See the in-app guide at [/docs/customization](http://localhost:3000/docs/customization) and [/docs/settings](http://localhost:3000/docs/settings) for details.

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
  snapshots/{entityId}/  Entity version history
  uploads/{entityId}/    Gallery, attachments, profile
  uploads/cases/{id}/profile/
  uploads/groups/{id}/profile/
  backups/               Auto-backups before import (optional)
  runs/                  Reserved for future script run history
```

Updates use atomic writes (temp file + rename) to reduce the risk of corrupted JSON if the process is interrupted.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Run the production server (after `build`) |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run seed:mock` | Load sample investigation data under `data/` |

## Tech stack

- **Framework:** Next.js 16, React 19, TypeScript
- **UI:** Tailwind CSS 4, Radix UI, Lucide icons
- **Graphs:** React Flow, d3-force
- **Markdown:** remark/rehype with GFM and wiki-link support
- **Reports:** HTML export, PDF via `@react-pdf/renderer`
- **Storage:** Local JSON files and filesystem uploads (no database)

## Roadmap

Script run history, full Obsidian embeds, encrypted export, follow-up reminders, auto-backup scheduling.
