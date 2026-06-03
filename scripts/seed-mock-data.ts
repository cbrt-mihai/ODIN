/**
 * Seeds a sample investigation under data/ for local development.
 * Run: npm run seed:mock
 * Pass --keep to append without removing existing entity/case/group files.
 */

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { DEFAULT_SETTINGS } from "../lib/defaults/settings";
import type {
  ActivityEntry,
  Attachment,
  Case,
  ContextEntry,
  Entity,
  Field,
  GalleryImage,
  Group,
  InboxItem,
  NoteEntry,
  Playbook,
  Relationship,
  Resource,
  SavedView,
  Tool,
} from "../lib/types";
import type { TrashEntry } from "../lib/storage/trash";

const DATA = path.join(process.cwd(), "data");

export const IDS = {
  elena: "a1111111-1111-4111-8111-000000000001",
  elenaDupe: "a1111111-1111-4111-8111-000000000099",
  james: "a1111111-1112-4112-8122-000000000002",
  jamesDupe: "a1111111-1112-4112-8122-000000000098",
  marcusReedA: "a1111111-1113-4113-8133-000000000011",
  marcusReedB: "a1111111-1114-4114-8144-000000000012",
  northline: "a2222222-2221-4221-8221-000000000003",
  domainNl: "a3333333-3331-4331-8331-000000000004",
  domainElena: "a3333333-3332-4332-8332-000000000005",
  phishingKit: "a4444444-4441-4444-8444-000000000006",
  typosquat: "a5555555-5555-4555-8555-000000000010",
  caseGlass: "b5555555-5551-4551-8555-000000000007",
  caseArchive: "b5555555-5552-4552-8552-000000000008",
  caseClosed: "b5555555-5553-4553-8553-000000000009",
  groupNorthline: "g1111111-1111-4111-8111-000000000001",
  groupPersons: "g1111111-1112-4112-8122-000000000002",
  toolSherlock: "c6666666-6661-4661-8661-000000000001",
  toolOsintFramework: "c6666666-6662-4662-8662-000000000002",
  toolInternal: "c6666666-6663-4663-8663-000000000003",
  toolMaltego: "c6666666-6664-4664-8664-000000000004",
  toolTrashed: "c6666666-6665-4665-8665-000000000005",
  resMdGuide: "d7777777-7771-4771-8771-000000000001",
  resExt: "d7777777-7772-4772-8772-000000000002",
  resHtml: "d7777777-7773-4773-8773-000000000003",
  playbookPerson: "e8888888-8881-4881-8881-000000000001",
  playbookDomain: "e8888888-8882-4882-8882-000000000002",
  playbookOrg: "e8888888-8883-4883-8883-000000000003",
  playbookTrashed: "e8888888-8884-4884-8884-000000000004",
  inbox1: "f9999999-9991-4991-8991-000000000001",
  inbox2: "f9999999-9992-4992-8992-000000000002",
  inbox3: "f9999999-9993-4993-8993-000000000003",
  inbox4: "f9999999-9994-4994-8994-000000000004",
  inbox5: "f9999999-9995-4995-8995-000000000005",
} as const;

const now = new Date();
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 86400000).toISOString();
const hoursAgo = (n: number) =>
  new Date(now.getTime() - n * 3600000).toISOString();

/** Calendar label for narrative text (e.g. "May 7, 2026"). */
function fmtDate(daysBack: number) {
  const d = new Date(now.getTime() - daysBack * 86400000);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MATTER = "NL-2025-0412";
const LEAD = "K. Morrow";
const SUPPORT = "R. Okonkwo";

function field(
  id: string,
  label: string,
  type: Field["type"],
  data: unknown,
  confidence: Field["provenance"]["confidence"] = "unsure",
  provenance?: Partial<Field["provenance"]>,
  extra?: Partial<Field>,
): Field {
  return {
    id,
    label,
    type,
    value: { type, data },
    order: extra?.order ?? 0,
    typeConfig: extra?.typeConfig,
    provenance: { confidence, ...provenance },
    contextEntries: extra?.contextEntries,
    noteEntries: extra?.noteEntries,
    valueFlavor: extra?.valueFlavor,
  };
}

function section(
  id: string,
  title: string,
  order: number,
  fields: Field[],
) {
  return { id, title, order, fields };
}

function typosquatSections() {
  return [
    section("ts1", "WHOIS / RDAP", 0, [
      field("sf1", "Registrar", "shortText", "Porkbun LLC", "sure", {
        source: "WHOISXML API pull",
        collectedAt: daysAgo(6),
        notes: `${LEAD} — saved to attachments on northline.io entity by mistake first, moved here ${fmtDate(6)}`,
      }),
      field("sf6", "Abuse desk", "email", "abuse@porkbun.com", "sure", {
        source: "RDAP",
      }),
      field("sf7", "Registrant phone (WHOIS)", "phone", "+1-503-555-0148", "unsure", {
        notes: "GoDaddy voicemail box; probably privacy relay",
      }),
      field("sf9", "Created", "date", "2025-02-18", "sure"),
      field(
        "sf19",
        "Brand owner",
        "entityLink",
        { entityId: IDS.northline, entityType: "organization" },
        "sure",
      ),
    ]),
    section("ts2", "Resolution & hosting", 1, [
      field("sf5", "URL (login)", "url", "https://support-northline.com/login", "sure", {
        source: "Customer email 4 Mar",
      }),
      field(
        "sf2",
        "HTTP behavior",
        "longText",
        "302 → Cloudflare → static bucket. Form POST goes to https://api.support-northline.com/v1/session (different A record). Last passive resolve for apex: 185.220.101.42 — see crt.sh id 28441930172.",
        "inferred",
        { collectedAt: daysAgo(3) },
      ),
      field(
        "sf3",
        "A / AAAA",
        "shortText",
        "185.220.101.42 (A) — no AAAA at last check",
        "sure",
        { collectedAt: daysAgo(1) },
      ),
      field("sf8", "Passive DNS hits (30d)", "number", 17, "inferred", {
        source: "RiskIQ",
        notes: `${SUPPORT} thinks count is low because host is young`,
      }),
      field(
        "sf10",
        "Last seen resolving",
        "datetime",
        daysAgo(1).slice(0, 16),
        "sure",
      ),
      field("sf13", "Geo (A record)", "location", {
        label: "Amsterdam",
        address: "Netherlands",
        lat: 52.3676,
        lng: 4.9041,
        notes: "MaxMind at collection; CDN may mislead",
      }),
    ]),
    section("ts3", "Case notes", 2, [
      field(
        "sf4",
        "Working notes",
        "obsidianMarkdown",
        `Opened ${fmtDate(10)} after CISO paste. Branding matches portal — compare [[Phishing kit “Glass Desk”]].\n\n- ${fmtDate(2)}: abuse filed Porkbun **#PB-88421** (waiting)\n- Forum tip on [[Elena Vasquez]] is **not** confirmed tied to host yet\n\n> [!warning] Live collection\n> VM only. No corp egress per counsel (${fmtDate(3)}).`,
        "sure",
      ),
      field("sf11", "Operator activity window", "dateRange", {
        start: { kind: "known", value: "2025-02-18", precision: "day" },
        end: { kind: "present" },
        notes: `First customer report ${fmtDate(20)}`,
      }),
      field("sf12", "Sightings", "dates", {
        entries: [
          {
            id: "de1",
            date: daysAgo(12).slice(0, 10),
            confidence: "sure",
            description: "urlscan 7a3c1f2b — submitted by anonymous",
          },
          {
            id: "de2",
            date: daysAgo(6).slice(0, 10),
            useDateTime: true,
            confidence: "inferred",
            description: "A record pivot to 185.220.x (passive)",
          },
        ],
      }),
      field("sf14", "Login clone confirmed", "boolean", true, "sure", {
        source: "Client screenshot + urlscan",
      }),
      field(
        "sf15",
        "Client takedown priority",
        "dropdown",
        "high",
        "sure",
        undefined,
        {
          typeConfig: {
            options: [
              { id: "low", label: "Low" },
              { id: "medium", label: "Medium" },
              { id: "high", label: "High" },
            ],
          },
        },
      ),
      field(
        "sf16",
        "Open tasks",
        "checklist",
        ["whois", "passive-dns", "cert-transparency"],
        "unsure",
        {
          notes: "registrar-abuse filed — checked off outside system",
        },
      ),
      field(
        "sf17",
        "Tags",
        "tags",
        ["typosquat", "glass-desk", "matter-nl-0412"],
        "sure",
      ),
      field("sf18", "Login capture", "image", {
        source: "url",
        url: "https://urlscan.io/screenshots/7a3c1f2b-9d4e-41b0-a1f2-nl-login.png",
      }),
    ]),
  ];
}

const elenaContext: ContextEntry[] = [
  {
    id: "ctx1",
    title: "Why she is in scope",
    kind: "overview",
    body: `Northline contract analyst (${fmtDate(30)} start per HR). Not a suspect — in scope because of staging access + public writing on credential phishing. Client wants her ruled in or out before they confront staff.\n\nMatter **${MATTER}**.`,
    bodyFlavor: "obsidian",
    tags: ["priority", MATTER],
    order: 0,
  },
  {
    id: "ctx2",
    title: "Working hypothesis",
    kind: "hypothesis",
    body: "Most likely uninvolved. Alternate (low confidence): insider knowledge of portal CSS reused in kit. No evidence she registered typosquat.",
    bodyFlavor: "markdown",
    order: 1,
  },
  {
    id: "ctx3",
    title: "Caveat",
    kind: "caveat",
    body: `${SUPPORT} notes BreachForums post could be unrelated opportunist using similar handle — do not treat as attribution.`,
    order: 2,
  },
];

const elenaNotes: NoteEntry[] = [
  {
    id: "note1",
    title: "HR call — 19 May",
    kind: "interview",
    body: `Spoke with Northline HR (Laura P.). Confirmed contractor, access to staging metrics index, no termination planned. They did **not** recognize forum handle evasquez_osint.\n\n— ${LEAD}`,
    bodyFlavor: "markdown",
    tags: ["hr"],
    order: 0,
  },
  {
    id: "note2",
    title: "Open",
    kind: "open_question",
    body: `Still need: GitHub commit history on public repos (any portal assets?), compare mobile # to HLR when legal approves active checks.`,
    order: 1,
  },
  {
    id: "note3",
    title: "Counsel",
    kind: "internal",
    body: `Passive only until written sign-off. No pretext contact with subject. (${fmtDate(3)} call — see case timeline.)`,
    order: 2,
  },
];

const entities: Entity[] = [
  {
    id: IDS.elena,
    type: "person",
    displayName: "Elena Vasquez",
    slug: "elena-vasquez",
    aliases: ["E. Vasquez", "evasquez"],
    tags: ["priority", "contractor", MATTER],
    caseIds: [IDS.caseGlass],
    groupIds: [IDS.groupPersons, IDS.groupNorthline],
    contextEntries: elenaContext,
    noteEntries: elenaNotes,
    provenance: {
      confidence: "sure",
      source: "Northline HR + public web",
      collectedAt: daysAgo(20),
      notes: `Profile owner: ${LEAD}`,
      proofs: [
        {
          id: "proof1",
          title: "Team page — northline.io",
          kind: "url",
          url: "https://www.northline.io/about/team",
          confidence: "sure",
          collectedAt: daysAgo(30),
          order: 0,
        },
        {
          id: "proof2",
          title: "elena.dev registration timing",
          kind: "analysis",
          excerpt:
            "WHOIS privacy on elena.dev; created 2019-06. Predates Northline contract — weak temporal link.",
          confidence: "deduced",
          collectedAt: daysAgo(12),
          order: 1,
        },
      ],
    },
    sections: [
      section("s1", "Overview", 0, [
        field(
          "f1",
          "Role (current)",
          "shortText",
          "Threat intelligence analyst — contractor",
          "sure",
          {
            source: "HR + LinkedIn archive (Wayback 2024-11)",
            collectedAt: daysAgo(19),
            proofs: [
              {
                id: "fp1",
                title: "Wayback LinkedIn PDF",
                kind: "document",
                confidence: "sure",
                collectedAt: daysAgo(19),
                order: 0,
              },
            ],
          },
          {
            contextEntries: [
              {
                id: "fc1",
                title: "HR",
                kind: "background",
                body: "Reports to CISO office dotted-line. SOW renewed Feb 2025.",
                order: 0,
              },
            ],
          },
        ),
        field(
          "f2",
          "Analyst notes",
          "obsidianMarkdown",
          `Linked from [[Northline Analytics]] team page ${fmtDate(20)}. Personal site [[elena.dev]] is privacy WHOIS — not proof of ownership but consistent.\n\nOld OSINT forum handle **evasquez_osint** (2018 posts) surfaced again ${fmtDate(1)} — HR says not her; treat as unresolved.`,
          "deduced",
          { notes: `Last touched ${fmtDate(0)} ${LEAD}` },
        ),
      ]),
      section("s2", "Contact", 1, [
        field(
          "f3",
          "Work email",
          "email",
          "elena.vasquez@northline.io",
          "sure",
          {
            source: "Team page",
            sourceUrl: "https://www.northline.io/about/team",
            collectedAt: daysAgo(20),
          },
        ),
        field("f4", "Mobile", "phone", "+1-415-555-0142", "inferred", {
          source: "BSides SF 2024 badge leak dataset",
          notes: "HLR pending legal approval",
        }),
        field("f5", "Personal site", "url", "https://elena.dev", "sure", {
          source: "Listed on conference bio",
        }),
        field(
          "f6",
          "Employer",
          "entityLink",
          { entityId: IDS.northline, entityType: "organization" },
          "sure",
        ),
      ]),
      section("s3", "Online presence", 2, [
        field(
          "f7",
          "Usernames",
          "tags",
          ["evasquez", "elena-v-osint", "evasquez_osint"],
          "unsure",
          {
            notes: "Last two unverified on live platforms",
          },
        ),
        field(
          "f8",
          "Prior employer claim (debunked)",
          "shortText",
          "Acme Corp — listed on old conference bio",
          "debunked",
          {
            source: "HR verification call",
            collectedAt: daysAgo(5),
            validity: {
              validFrom: "2016-01-01",
              validTo: "2017-12-31",
              precision: "year",
            },
            notes: "Bio never updated; HR confirmed she was at UC Berkeley lab during that period",
          },
        ),
      ]),
    ],
    galleryFolders: [
      { id: "gf1", name: "Screenshots", order: 0 },
      { id: "gf2", name: "Documents", parentId: undefined, order: 1 },
    ],
    gallery: [] as GalleryImage[],
    attachments: [] as Attachment[],
    events: [
      {
        id: "ev1",
        title: "Added to Glass Desk scope",
        description: `Listed in matter ${MATTER} intake memo (staging access)`,
        occurredAt: daysAgo(11),
        type: "other",
        order: 0,
      },
      {
        id: "ev2",
        title: "HR screening call",
        occurredAt: daysAgo(5),
        type: "contact",
        description: "Laura P. / Northline HR — cooperative, no adverse info",
        order: 1,
      },
      {
        id: "ev3",
        title: "Counsel hold on direct contact",
        occurredAt: daysAgo(4),
        type: "legal",
        description: "No outreach to subject until client signs revised letter",
        order: 2,
      },
    ],
    createdAt: daysAgo(20),
    updatedAt: hoursAgo(6),
  },
  {
    id: IDS.elenaDupe,
    type: "person",
    displayName: "Elena V. Vasquez",
    slug: "elena-v-vasquez",
    aliases: ["E. Vasquez", "Elena Vasquez (CRM)"],
    tags: ["crm-import"],
    caseIds: [],
    groupIds: [],
    sections: [
      section("s1", "Overview", 0, [
        field(
          "f1",
          "Notes",
          "longText",
          `Salesforce contact ID 003Hr00002NLVas — imported ${fmtDate(10)} before we had the full OSINT profile. Same email as [[Elena Vasquez]]. Likely duplicate; merge when ${LEAD} signs off.`,
          "deduced",
          { source: "Client CRM export", collectedAt: daysAgo(10) },
        ),
      ]),
      section("s2", "Contact", 1, [
        field(
          "f2",
          "Email",
          "email",
          "elena.vasquez@northline.io",
          "unsure",
        ),
        field("f3", "Phone", "phone", "+1-415-555-0142", "inferred"),
      ]),
    ],
    contextEntries: [
      {
        id: "ctx-d1",
        title: "CRM import",
        kind: "background",
        body: "Stub record from Salesforce export — minimal fields only.",
        order: 0,
      },
    ],
    noteEntries: [
      {
        id: "note-d1",
        title: "Merge checklist",
        kind: "internal",
        body: `Confirm with ${LEAD} before merging into main Elena profile. Keep CRM contact ID in aliases.`,
        order: 0,
      },
    ],
    provenance: {
      confidence: "unsure",
      source: "Client CRM export",
      collectedAt: daysAgo(10),
      proofs: [
        {
          id: "proof-d1",
          title: "Salesforce contact export row",
          kind: "document",
          excerpt: "003Hr00002NLVas — duplicate email with primary subject",
          confidence: "deduced",
          order: 0,
        },
      ],
    },
    gallery: [],
    attachments: [],
    events: [
      {
        id: "ev-d1",
        title: "CRM import",
        description: "Auto-created from client Salesforce sync",
        occurredAt: daysAgo(10),
        type: "other",
        order: 0,
      },
    ],
    createdAt: daysAgo(10),
    updatedAt: daysAgo(8),
  },
  {
    id: IDS.james,
    type: "person",
    displayName: "James Chen",
    slug: "james-chen",
    aliases: [],
    tags: ["contractor", "witness"],
    caseIds: [IDS.caseGlass, IDS.caseArchive],
    groupIds: [IDS.groupPersons],
    sections: [
      section("s1", "Overview", 0, [
        field(
          "f1",
          "Background",
          "longText",
          `DevOps contractor on Northline staging K8s (SOW ends July 2025). Entered Glass Desk because j.chen@proton.me appeared in CT log for *.staging.northline.io — may be legit admin contact.\n\nPrior: interviewed in [[Meridian Mutual — wire fraud (2024)]] as witness only.`,
          "deduced",
          { notes: `${SUPPORT} drafted; ${LEAD} reviewed ${fmtDate(7)}` },
        ),
        field(
          "f2",
          "SOW reference",
          "shortText",
          "NL-STC-2024-088 (Kubernetes platform)",
          "sure",
          { source: "Client redacted SOW summary" },
        ),
        field(
          "f2b",
          "Contract window (OSINT)",
          "dateRange",
          {
            start: { kind: "known", value: "2024-06-01", precision: "day" },
            end: { kind: "known", value: "2025-07-31", precision: "day" },
            notes: "Per client SOW summary — conflicts with HR roster export on duplicate",
          },
          "sure",
        ),
      ]),
      section("s2", "Contact", 1, [
        field("f2c", "Email (observed)", "email", "j.chen@proton.me", "unsure", {
          source: "crt.sh SAN export 2025-05-06",
          notes: "Not confirmed as personal vs role mailbox",
        }),
        field(
          "f3",
          "Engagement",
          "entityLink",
          { entityId: IDS.northline, entityType: "organization" },
          "inferred",
        ),
      ]),
    ],
    gallery: [],
    attachments: [],
    events: [
      {
        id: "jev1",
        title: "CT log hit — staging cert",
        description: "j.chen@proton.me in SAN; forwarded to client infra team 6 May",
        occurredAt: daysAgo(8),
        type: "digital",
        order: 0,
      },
    ],
    createdAt: daysAgo(12),
    updatedAt: daysAgo(3),
  },
  {
    id: IDS.jamesDupe,
    type: "person",
    displayName: "James Chen (vendor roster)",
    slug: "james-chen-vendor",
    aliases: ["James Chen", "J. Chen — HR export"],
    tags: ["crm-import", "merge-test"],
    caseIds: [IDS.caseGlass],
    groupIds: [],
    contextEntries: [
      {
        id: "jc-ctx1",
        title: "HR vendor list",
        kind: "background",
        body: "Row 44 on Northline contractor spreadsheet — may be stale vs CT log contact.",
        order: 0,
      },
    ],
    noteEntries: [
      {
        id: "jc-note1",
        title: "Merge review",
        kind: "internal",
        body: `Second merge test fixture. Compare date ranges, evidence, and timeline with primary [[James Chen]]. ${SUPPORT} to validate proton email.`,
        order: 0,
      },
      {
        id: "jc-note2",
        title: "Open",
        kind: "open_question",
        body: "Is vendor roster phone (+1-628-555-0199) a personal line or IT desk?",
        order: 1,
      },
    ],
    provenance: {
      confidence: "unsure",
      source: "Client HR vendor export",
      collectedAt: daysAgo(7),
      proofs: [
        {
          id: "jc-proof1",
          title: "Vendor spreadsheet excerpt",
          kind: "document",
          excerpt: "Lists j.chen@proton.me — same as CT log observation on primary",
          confidence: "inferred",
          order: 0,
        },
        {
          id: "jc-proof2",
          title: "Conflicting mobile on roster",
          kind: "analysis",
          excerpt: "+1-628-555-0199 vs no mobile on primary OSINT profile",
          confidence: "unsure",
          order: 1,
        },
      ],
    },
    sections: [
      section("s1", "Overview", 0, [
        field(
          "f1",
          "Roster notes",
          "longText",
          `Duplicate candidate for [[James Chen]]. Imported ${fmtDate(7)} from HR vendor CSV. Same observed email; different phone and SOW end date.`,
          "deduced",
          { source: "HR export v3", collectedAt: daysAgo(7) },
        ),
        field(
          "f2",
          "Contract window (roster)",
          "dateRange",
          {
            start: { kind: "known", value: "2024-01-01", precision: "day" },
            end: { kind: "known", value: "2025-12-31", precision: "day" },
            notes: "Roster shows extension — primary profile says July 2025",
          },
          "unsure",
        ),
      ]),
      section("s2", "Contact", 1, [
        field("f3", "Email (roster)", "email", "j.chen@proton.me", "unsure", {
          source: "HR vendor CSV",
        }),
        field("f4", "Phone (roster)", "phone", "+1-628-555-0199", "inferred", {
          notes: "Not on primary profile — possible alternate contact",
        }),
      ]),
    ],
    gallery: [],
    attachments: [],
    events: [
      {
        id: "jc-ev1",
        title: "Vendor list refresh",
        description: "HR sent updated contractor export",
        occurredAt: daysAgo(7),
        type: "other",
        order: 0,
      },
      {
        id: "jc-ev2",
        title: "Flagged for merge review",
        description: `${LEAD} asked to reconcile with OSINT profile`,
        occurredAt: daysAgo(4),
        type: "other",
        order: 1,
      },
    ],
    createdAt: daysAgo(7),
    updatedAt: daysAgo(2),
  },
  {
    id: IDS.marcusReedA,
    type: "person",
    displayName: "Marcus Reed",
    slug: "marcus-reed-portland",
    aliases: ["M. Reed"],
    tags: ["homonym-demo", "witness"],
    caseIds: [IDS.caseArchive],
    groupIds: [IDS.groupPersons],
    sections: [
      section("s1", "Overview", 0, [
        field(
          "f1",
          "Role",
          "shortText",
          "Former Meridian Mutual claims adjuster — witness in 2024 wire case",
          "sure",
          { source: "Court exhibit list" },
        ),
        field("f2", "Location", "location", {
          label: "Portland, OR",
          address: "Oregon, USA",
          notes: "Not the Austin Marcus Reed",
        }),
      ]),
      section("s2", "Contact", 1, [
        field("f3", "Email", "email", "marc.reed@example.com", "sure"),
        field("f4", "Phone", "phone", "+1-503-555-0188", "sure"),
      ]),
    ],
    gallery: [],
    attachments: [],
    events: [],
    createdAt: daysAgo(90),
    updatedAt: daysAgo(40),
  },
  {
    id: IDS.marcusReedB,
    type: "person",
    displayName: "Marcus Reed",
    slug: "marcus-reed-austin",
    aliases: ["Marcus T. Reed"],
    tags: ["homonym-demo", "lead"],
    caseIds: [],
    groupIds: [],
    sections: [
      section("s1", "Overview", 0, [
        field(
          "f1",
          "Role",
          "shortText",
          "Acme Corp procurement — unrelated to Portland witness",
          "inferred",
          { notes: "Same full name — use email/location to tell apart" },
        ),
        field("f2", "Location", "location", {
          label: "Austin, TX",
          address: "Texas, USA",
        }),
      ]),
      section("s2", "Contact", 1, [
        field("f3", "Email", "email", "m.reed@acme.corp", "sure"),
        field("f4", "Phone", "phone", "+1-512-555-0144", "inferred"),
        field(
          "f5",
          "Employer",
          "shortText",
          "Acme Corp (unrelated to Northline matter)",
          "sure",
        ),
      ]),
    ],
    gallery: [],
    attachments: [],
    events: [],
    createdAt: daysAgo(45),
    updatedAt: daysAgo(15),
  },
  {
    id: IDS.northline,
    type: "organization",
    displayName: "Northline Analytics",
    slug: "northline-analytics",
    aliases: ["Northline Analytics Ltd"],
    tags: ["client", "victim"],
    caseIds: [IDS.caseGlass, IDS.caseClosed],
    groupIds: [IDS.groupNorthline],
    sections: [
      section("s1", "Overview", 0, [
        field(
          "f1",
          "Profile",
          "richMarkdown",
          "B2B analytics vendor, ~120 FTE. Delaware corp; HQ 548 Market St, SF. Customer portal at [app.northline.io](https://app.northline.io).\n\n**Client POC:** M. Okonkwo (CISO) — Slack primary channel.",
          "sure",
          { source: "Engagement letter" },
        ),
        field("f2", "Client POC", "shortText", "M. Okonkwo (CISO)", "sure"),
        field(
          "f2b",
          "Analyst in scope",
          "entityLink",
          { entityId: IDS.elena, entityType: "person" },
          "inferred",
          { notes: "Contractor — not a company officer" },
        ),
        field("f3", "Headcount (approx)", "number", 118, "inferred", {
          source: "LinkedIn headcount scrape",
        }),
        field("f4", "Publicly traded", "boolean", false, "sure"),
      ]),
      section("s2", "Corporate", 1, [
        field("f5", "Jurisdiction", "shortText", "Delaware, USA", "sure"),
        field("f6", "Incorporated", "date", "2018-03-15", "sure", {
          collectedAt: daysAgo(60),
        }),
        field(
          "f7",
          "Prior incident",
          "shortText",
          "Jan 2025 notice leak — see closed case",
          "sure",
          { notes: "Unrelated to Glass Desk per client" },
        ),
      ]),
    ],
    gallery: [],
    attachments: [],
    events: [
      {
        id: "nev1",
        title: "Retainer signed",
        description: `Hartwell engagement ${MATTER}`,
        occurredAt: daysAgo(11),
        type: "legal",
        order: 0,
      },
    ],
    createdAt: daysAgo(18),
    updatedAt: daysAgo(4),
  },
  {
    id: IDS.domainNl,
    type: "domain",
    displayName: "northline.io",
    slug: "northline-io",
    aliases: [],
    tags: ["ioc"],
    caseIds: [IDS.caseGlass],
    groupIds: [IDS.groupNorthline],
    sections: [
      section("s1", "WHOIS", 0, [
        field(
          "f1",
          "Registrar",
          "shortText",
          "Namecheap, Inc.",
          "sure",
          { source: "WHOISXML", collectedAt: daysAgo(5) },
        ),
        field(
          "f2",
          "Registrant",
          "entityLink",
          { entityId: IDS.northline, entityType: "organization" },
          "sure",
        ),
        field(
          "f3",
          "DNSSEC",
          "shortText",
          "unsigned",
          "sure",
          { collectedAt: daysAgo(5) },
        ),
      ]),
      section("s2", "DNS", 1, [
        field(
          "f4",
          "A (apex)",
          "shortText",
          "104.21.32.55 — Cloudflare proxy",
          "sure",
          { collectedAt: daysAgo(5) },
        ),
        field(
          "f5",
          "MX",
          "tags",
          ["aspmx.l.google.com", "alt1.aspmx.l.google.com"],
          "sure",
        ),
        field(
          "f6",
          "SPF",
          "shortText",
          "v=spf1 include:_spf.google.com ~all",
          "sure",
        ),
        field(
          "f7",
          "Notes",
          "obsidianMarkdown",
          `Wildcard cert renewed ${fmtDate(5)} — see inbox triage. Legitimate property; do not confuse with [[support-northline.com]].`,
          "sure",
        ),
      ]),
    ],
    gallery: [],
    attachments: [],
    events: [
      {
        id: "dev1",
        title: "Wildcard cert renewal",
        description: "crt.sh — *.northline.io re-issued Google Trust Services",
        occurredAt: daysAgo(5),
        type: "digital",
        order: 0,
      },
    ],
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2),
  },
  {
    id: IDS.domainElena,
    type: "domain",
    displayName: "elena.dev",
    slug: "elena-dev",
    aliases: [],
    tags: ["personal"],
    caseIds: [],
    groupIds: [],
    sections: [
      section("s1", "Registration", 0, [
        field("f1", "Registrar", "shortText", "Google Domains → Squarespace", "sure"),
        field("f2", "Created", "date", "2019-06-02", "sure"),
        field(
          "f3",
          "Registrant",
          "shortText",
          "REDACTED (privacy proxy)",
          "sure",
        ),
        field(
          "f4",
          "Linked person",
          "entityLink",
          { entityId: IDS.elena, entityType: "person" },
          "deduced",
          { notes: "Inference from conference bio + timing only" },
        ),
      ]),
      section("s2", "Hosting", 1, [
        field("f5", "A record", "shortText", "185.199.108.153 (GitHub Pages)", "sure"),
        field(
          "f6",
          "Site",
          "url",
          "https://elena.dev",
          "sure",
        ),
      ]),
    ],
    gallery: [],
    attachments: [],
    events: [],
    createdAt: daysAgo(10),
    updatedAt: daysAgo(5),
  },
  {
    id: IDS.phishingKit,
    type: "general",
    displayName: "Phishing kit “Glass Desk”",
    slug: "phishing-kit-glass-desk",
    aliases: ["GlassDesk kit", "nl-portal-clone"],
    tags: ["malware", "artifact", "glass-desk"],
    caseIds: [IDS.caseGlass],
    groupIds: [],
    sections: [
      section("s1", "Overview", 0, [
        field(
          "f1",
          "Description",
          "longText",
          `ZIP from CISO paste (${fmtDate(10)}). Bundle name glass_desk_v2.zip. login.html pulls /assets/nl-brand.css (hash matches customer portal). JS posts credentials to Telegram bot — token in config.json was dead on ${fmtDate(8)} sandbox run.`,
          "inferred",
          { source: "ANY.RUN sandbox 2025-05-11", collectedAt: daysAgo(9) },
        ),
        field(
          "f1b",
          "SHA-256 (zip)",
          "shortText",
          "a4f2c8e91b…d03e (full in attachment)",
          "sure",
          { source: "Client IR team" },
        ),
        field(
          "f2",
          "Components",
          "checklist",
          ["landing-page", "credential-harvest", "telegram-exfil"],
          "sure",
        ),
        field(
          "f3",
          "Severity",
          "dropdown",
          "critical",
          "inferred",
          undefined,
          {
            typeConfig: {
              options: [
                { id: "low", label: "Low" },
                { id: "medium", label: "Medium" },
                { id: "critical", label: "Critical" },
              ],
            },
          },
        ),
      ]),
    ],
    gallery: [],
    attachments: [],
    events: [
      {
        id: "kev1",
        title: "Sandbox detonation",
        occurredAt: daysAgo(9),
        type: "digital",
        description: "ANY.RUN — no C2 callback; Telegram API 401",
        order: 0,
      },
    ],
    createdAt: daysAgo(8),
    updatedAt: daysAgo(1),
  },
  {
    id: IDS.typosquat,
    type: "domain",
    displayName: "support-northline.com",
    slug: "support-northline-com",
    aliases: ["support-northline[.]com"],
    tags: ["typosquat", "ioc", MATTER],
    caseIds: [IDS.caseGlass],
    groupIds: [],
    sections: typosquatSections(),
    gallery: [],
    attachments: [],
    events: [
      {
        id: "tev1",
        title: "Registrar abuse ticket filed",
        occurredAt: daysAgo(2),
        type: "legal",
        description: "Ticket #PB-88421 with Porkbun",
        order: 0,
      },
    ],
    createdAt: daysAgo(6),
    updatedAt: daysAgo(1),
  },
];

const caseGlass: Case = {
  id: IDS.caseGlass,
  title: "Operation Glass Desk",
  description:
    `## Matter ${MATTER}\n\n**Client:** [[Northline Analytics]] (Hartwell retainer)\n**Lead:** ${LEAD} | **Support:** ${SUPPORT}\n\n### Objective\n\nAttribute operators behind credential-harvesting sites impersonating the Northline customer portal.\n\n### In scope\n\n| Role | Entity |\n|------|--------|\n| Analyst (contract) | [[Elena Vasquez]] |\n| Infra contractor | [[James Chen]] |\n| Legit domain | [[northline.io]] |\n| Typosquat | [[support-northline.com]] |\n| Kit | [[Phishing kit “Glass Desk”]] |\n\n### Constraints\n\nPassive collection only — counsel call ${fmtDate(3)}. No live host interaction from corporate network.\n\n### Next steps\n\n- [ ] Compare Rentry v2 paste hashes to original kit\n- [ ] HLR on E. Vasquez mobile when approved\n- [ ] Porkbun abuse ticket **#PB-88421** follow-up`,
  status: "active",
  entityIds: [
    IDS.elena,
    IDS.james,
    IDS.northline,
    IDS.domainNl,
    IDS.phishingKit,
    IDS.typosquat,
  ],
  groupIds: [IDS.groupNorthline],
  toolIds: [
    IDS.toolSherlock,
    IDS.toolOsintFramework,
    IDS.toolInternal,
    IDS.toolMaltego,
  ],
  resourceIds: [IDS.resMdGuide, IDS.resExt, IDS.resHtml],
  playbookIds: [IDS.playbookPerson, IDS.playbookDomain],
  events: [
    {
      id: "ce0",
      title: "Customer report — fake login",
      occurredAt: daysAgo(20),
      type: "observation",
      description:
        "Helpdesk ticket NL-HD-44219: support-northline.com reported by enterprise customer",
      entityIds: [IDS.typosquat],
      order: 0,
    },
    {
      id: "ce1",
      title: "Engagement opened",
      occurredAt: daysAgo(11),
      type: "legal",
      description: `Hartwell retainer ${MATTER} — intake call CISO`,
      order: 1,
    },
    {
      id: "ce2",
      title: "CISO shared Rentry paste",
      occurredAt: daysAgo(10),
      type: "observation",
      description:
        "rentry.co/8k2f-nl-portal — glass_desk_v2.zip; chain-of-custody email archived",
      entityIds: [IDS.phishingKit],
      order: 2,
    },
    {
      id: "ce3",
      title: "Sandbox — kit detonation",
      occurredAt: daysAgo(9),
      type: "digital",
      entityIds: [IDS.phishingKit],
      order: 3,
    },
    {
      id: "ce4",
      title: "WHOIS — typosquat",
      occurredAt: daysAgo(6),
      type: "digital",
      entityIds: [IDS.typosquat],
      order: 4,
    },
    {
      id: "ce5",
      title: "HR call — Elena Vasquez",
      occurredAt: daysAgo(5),
      type: "contact",
      entityIds: [IDS.elena],
      order: 5,
    },
    {
      id: "ce6",
      title: "Counsel — collection limits",
      occurredAt: daysAgo(3),
      type: "legal",
      description:
        "Outside counsel: passive OSINT only; no intrusive scanning of third-party hosts",
      order: 6,
    },
    {
      id: "ce7",
      title: "Registrar abuse filed",
      occurredAt: daysAgo(2),
      type: "legal",
      description: "Porkbun ticket #PB-88421 (support-northline.com)",
      entityIds: [IDS.typosquat],
      order: 7,
    },
  ],
  playbookProgress: [
    {
      playbookId: IDS.playbookPerson,
      completedStepIds: ["pb-s1", "pb-s2"],
      startedAt: daysAgo(9),
      updatedAt: daysAgo(1),
    },
    {
      playbookId: IDS.playbookDomain,
      completedStepIds: ["pb-d1"],
      startedAt: daysAgo(6),
      updatedAt: daysAgo(2),
    },
  ],
  tags: ["phishing", MATTER, "client-northline"],
  createdAt: daysAgo(11),
  updatedAt: hoursAgo(2),
};

const caseArchive: Case = {
  id: IDS.caseArchive,
  title: "Meridian Mutual — wire fraud (2024)",
  description:
    `## Background (archived)\n\nQ4 2024 wire-fraud matter — unrelated vendor. [[James Chen]] interviewed as infrastructure witness (voluntary). No charges; referral only.\n\nKept on disk because Chen's Proton address reappeared during ${MATTER} CT review.`,
  status: "archived",
  entityIds: [IDS.james],
  toolIds: [IDS.toolOsintFramework],
  resourceIds: [IDS.resExt],
  playbookIds: [],
  events: [
    {
      id: "ca1",
      title: "Case archived",
      occurredAt: daysAgo(60),
      type: "other",
      order: 0,
    },
  ],
  playbookProgress: [],
  tags: ["archived", "wire-fraud"],
  createdAt: daysAgo(90),
  updatedAt: daysAgo(60),
};

const caseClosed: Case = {
  id: IDS.caseClosed,
  title: "Northline customer notice leak — Jan 2025",
  description:
    "Jan 2025: breach-notification draft emailed to wrong customer cohort (~400 messages). Northline revoked message, internal RCA complete. No external actor. Client asked us to keep file for context on communications discipline.",
  status: "closed",
  entityIds: [IDS.northline],
  events: [
    {
      id: "cc1",
      title: "Incident closed",
      occurredAt: daysAgo(30),
      type: "legal",
      order: 0,
    },
  ],
  playbookProgress: [],
  tags: ["closed"],
  createdAt: daysAgo(45),
  updatedAt: daysAgo(30),
};

const groups: Group[] = [
  {
    id: IDS.groupNorthline,
    title: "Northline — Glass Desk",
    description:
      `Working set for ${MATTER} — not exhaustive, just what ${LEAD} pinned for daily review.`,
    color: "#3b82f6",
    entityIds: [
      IDS.northline,
      IDS.domainNl,
      IDS.typosquat,
      IDS.elena,
      IDS.james,
    ],
    caseIds: [IDS.caseGlass],
    linkedGroupIds: [IDS.groupPersons],
    tags: ["glass-desk"],
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  },
  {
    id: IDS.groupPersons,
    title: "Persons of interest",
    description: "Subjects and witnesses referenced in active and archived cases.",
    color: "#a855f7",
    entityIds: [IDS.elena, IDS.james],
    linkedGroupIds: [IDS.groupNorthline],
    tags: ["persons"],
    createdAt: daysAgo(8),
    updatedAt: daysAgo(2),
  },
];

const tools: Tool[] = [
  {
    id: IDS.toolSherlock,
    name: "Sherlock",
    description: "Username search across social networks",
    category: "Username",
    tags: ["osint", "username"],
    kind: "external",
    url: "https://github.com/sherlock-project/sherlock",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: IDS.toolOsintFramework,
    name: "OSINT Framework",
    category: "Reference",
    tags: ["meta"],
    kind: "external",
    url: "https://osintframework.com/",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: IDS.toolInternal,
    name: "Glass Desk collection SOP",
    description: "Internal runbook for Northline impersonation sites",
    category: "Internal",
    tags: ["glass-desk", "sop"],
    kind: "internal_page",
    page: {
      format: "markdown",
      flavor: "rich",
      body: `## ${MATTER} — collection order (${LEAD})\n\n1. WHOIS/RDAP typosquat → compare to [[northline.io]]\n2. Passive DNS / CT — **VM only** for live URL\n3. Person pass on [[Elena Vasquez]] / [[James Chen]] before adding new entities\n4. Log everything on case timeline (client reads it)\n\n| Step | Tool |\n|------|------|\n| Handles | Sherlock |\n| Index | OSINT Framework |\n\n_Counsel: no corp-network live hits._`,
    },
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
  },
  {
    id: IDS.toolMaltego,
    name: "Maltego CE",
    description: "Link analysis and transforms (external)",
    category: "Graph",
    tags: ["graph", "commercial"],
    kind: "external",
    url: "https://www.maltego.com/",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(40),
  },
];

const trashedTool: Tool = {
  id: IDS.toolTrashed,
  name: "Hunter.io",
  description: "Org/email search — license expired Mar 2025",
  category: "Email",
  tags: ["deprecated"],
  kind: "external",
  url: "https://hunter.io/",
  createdAt: daysAgo(100),
  updatedAt: daysAgo(50),
};

const resources: Resource[] = [
  {
    id: IDS.resMdGuide,
    name: "Linking conventions (profiles & cases)",
    kind: "internal_page",
    page: {
      format: "markdown",
      flavor: "obsidian",
      body: "# Hartwell linking rules\n\nUse wikilinks in case narratives so the graph matches client-facing reports.\n\n- `[[Display Name]]` — default\n- `[[slug]]` when names repeat\n- `[[person:uuid]]` only when counsel requires redacted exports\n\nIf you rename an entity, search cases for old wikilink text.",
    },
    tags: ["sop"],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: IDS.resExt,
    name: "NIST Phishing Guide",
    kind: "external",
    url: "https://www.nist.gov/phishing",
    tags: ["reference"],
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
  {
    id: IDS.resHtml,
    name: "Registrar abuse template (HTML)",
    kind: "internal_page",
    page: {
      format: "html",
      body: "<h1>Registrar abuse — Hartwell template</h1><p><strong>Subject:</strong> Phishing / trademark — [FQDN]</p><p>We represent Northline Analytics, Inc. The domain [FQDN] impersonates our client's login at northline.io.</p><ul><li>Infringing URL</li><li>UTC first seen</li><li>SHA-256 of capture (if available)</li><li>Contact: investigations@hartwell.example</li></ul>",
    },
    tags: ["legal", "template"],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
];

const relationships: Relationship[] = [
  {
    id: "r1",
    fromEntityId: IDS.elena,
    toEntityId: IDS.northline,
    fromType: "person",
    toType: "organization",
    type: "employed_by",
    createdAt: daysAgo(15),
    updatedAt: daysAgo(15),
  },
  {
    id: "r2",
    fromEntityId: IDS.james,
    toEntityId: IDS.northline,
    fromType: "person",
    toType: "organization",
    type: "associated_with",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
  {
    id: "r3",
    fromEntityId: IDS.northline,
    toEntityId: IDS.domainNl,
    fromType: "organization",
    toType: "domain",
    type: "owns",
    bidirectional: true,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
  },
  {
    id: "r4",
    fromEntityId: IDS.elena,
    toEntityId: IDS.domainElena,
    fromType: "person",
    toType: "domain",
    type: "owns",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(8),
  },
  {
    id: "r5",
    fromEntityId: IDS.phishingKit,
    toEntityId: IDS.typosquat,
    fromType: "general",
    toType: "domain",
    type: "associated_with",
    label: "deployed on",
    caseId: IDS.caseGlass,
    provenance: {
      confidence: "deduced",
      source: "HTML asset hash match",
      notes: `${SUPPORT} — sandbox vs live host`,
    },
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
  },
  {
    id: "r8",
    fromEntityId: IDS.typosquat,
    toEntityId: IDS.domainNl,
    fromType: "domain",
    toType: "domain",
    type: "associated_with",
    label: "impersonates",
    caseId: IDS.caseGlass,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "r6",
    fromEntityId: IDS.domainNl,
    toEntityId: IDS.northline,
    fromType: "domain",
    toType: "organization",
    type: "registered_to",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "r7",
    fromEntityId: IDS.james,
    toEntityId: IDS.elena,
    fromType: "person",
    toType: "person",
    type: "associated_with",
    label: "same case",
    caseId: IDS.caseGlass,
    bidirectional: true,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
];

const inbox: InboxItem[] = [
  {
    id: IDS.inbox1,
    status: "pending",
    capturedAt: hoursAgo(4),
    contentType: "text",
    content: `From: M. Okonkwo <m.okonkwo@northline.io>\nSlack forward (${fmtDate(0)} 09:14)\n\nnew paste dropped https://rentry.co/8k2f-nl-portal-v2 — can you diff against last zip?`,
    notes: `${LEAD}: hash compare before download on corp machine`,
    suggestedEntityId: IDS.phishingKit,
  },
  {
    id: IDS.inbox2,
    status: "pending",
    capturedAt: daysAgo(1),
    contentType: "text",
    content:
      "[monitor] BreachForums scrape 2025-05-20T03:11Z — user evasquez_osint in thread \"northline staging\": \"keys drop friday\". No file, no proof of access.",
    notes: `Do not interact. ${SUPPORT} to check historical forum posts vs HR denial`,
    suggestedEntityId: IDS.elena,
  },
  {
    id: IDS.inbox3,
    status: "pending",
    capturedAt: daysAgo(2),
    contentType: "url",
    content: "https://urlscan.io/result/7a3c1f2b-9d4e-41b0-a1f2/",
    notes: "Matches support-northline.com form — add to typosquat gallery?",
    suggestedEntityId: IDS.typosquat,
  },
  {
    id: IDS.inbox4,
    status: "triaged",
    capturedAt: daysAgo(5),
    contentType: "url",
    content: "https://crt.sh/?id=28441930172",
    notes: `Logged wildcard renewal on northline.io — ${fmtDate(5)}`,
    triagedTo: {
      entityId: IDS.domainNl,
      caseId: IDS.caseGlass,
    },
  },
  {
    id: IDS.inbox5,
    status: "archived",
    capturedAt: daysAgo(20),
    contentType: "text",
    content:
      "Helpdesk export row 44219 (2025-03-04): customer reports \"support-northline.com\" login page — opened matter NL-2025-0412.",
    notes: "Canonical start date for case timeline",
  },
];

const playbooks: Playbook[] = [
  {
    id: IDS.playbookPerson,
    title: "Person baseline",
    description: "Hartwell — individual subject (open source)",
    steps: [
      {
        id: "pb-s1",
        title: "Enumerate usernames",
        description: "Run known aliases through Sherlock",
        toolId: IDS.toolSherlock,
        order: 0,
      },
      {
        id: "pb-s2",
        title: "Review OSINT Framework",
        toolId: IDS.toolOsintFramework,
        order: 1,
      },
      {
        id: "pb-s3",
        title: "Document findings in entity profile",
        resourceId: IDS.resMdGuide,
        order: 2,
      },
      {
        id: "pb-s4",
        title: "Check employer & domains",
        description: "Link org + domain entities",
        order: 3,
      },
    ],
  },
  {
    id: IDS.playbookDomain,
    title: "Domain investigation",
    description: "WHOIS, DNS, and certificate review",
    steps: [
      {
        id: "pb-d1",
        title: "WHOIS lookup",
        description: "Registrar and registrant org",
        order: 0,
      },
      {
        id: "pb-d2",
        title: "Passive DNS",
        toolId: IDS.toolMaltego,
        order: 1,
      },
      {
        id: "pb-d3",
        title: "Link to organization",
        resourceId: IDS.resMdGuide,
        order: 2,
      },
    ],
  },
  {
    id: IDS.playbookOrg,
    title: "Organization profile",
    description: "Corporate structure and key people",
    steps: [
      {
        id: "pb-o1",
        title: "Registration details",
        order: 0,
      },
      {
        id: "pb-o2",
        title: "Map key persons",
        order: 1,
      },
    ],
  },
];

const trashedPlaybook: Playbook = {
  id: IDS.playbookTrashed,
  title: "Vendor due diligence (2023 template)",
  description: "Replaced by client GRC portal — retained for reference",
  steps: [
    { id: "pb-t1", title: "Collect SOC 2 report", order: 0 },
    { id: "pb-t2", title: "Verify domain ownership", order: 1 },
  ],
};

const activity: ActivityEntry[] = [
  {
    id: "act1",
    at: daysAgo(11),
    action: "create",
    targetType: "case",
    targetId: IDS.caseGlass,
    summary: `Opened matter ${MATTER} — Operation Glass Desk`,
  },
  {
    id: "act2",
    at: daysAgo(11),
    action: "create",
    targetType: "entity",
    targetId: IDS.northline,
    summary: 'Created organization "Northline Analytics"',
  },
  {
    id: "act3",
    at: daysAgo(10),
    action: "create",
    targetType: "entity",
    targetId: IDS.typosquat,
    summary: 'Created domain "support-northline.com"',
  },
  {
    id: "act4",
    at: daysAgo(10),
    action: "create",
    targetType: "entity",
    targetId: IDS.phishingKit,
    summary: 'Created artifact "Phishing kit “Glass Desk”"',
  },
  {
    id: "act5",
    at: daysAgo(10),
    action: "create",
    targetType: "entity",
    targetId: IDS.elena,
    summary: 'Created person "Elena Vasquez"',
  },
  {
    id: "act6",
    at: daysAgo(9),
    action: "create",
    targetType: "group",
    targetId: IDS.groupNorthline,
    summary: 'Created group "Northline — Glass Desk"',
  },
  {
    id: "act7",
    at: daysAgo(9),
    action: "update",
    targetType: "case",
    targetId: IDS.caseGlass,
    summary: "Linked Rentry paste to case timeline",
  },
  {
    id: "act8",
    at: daysAgo(8),
    action: "create",
    targetType: "entity",
    targetId: IDS.james,
    summary: 'Created person "James Chen"',
  },
  {
    id: "act9",
    at: daysAgo(7),
    action: "update",
    targetType: "entity",
    targetId: IDS.phishingKit,
    summary: "Added sandbox hashes to Glass Desk kit",
  },
  {
    id: "act10",
    at: daysAgo(6),
    action: "update",
    targetType: "entity",
    targetId: IDS.typosquat,
    summary: "Split typosquat into WHOIS / resolution sections",
  },
  {
    id: "act11",
    at: daysAgo(5),
    action: "update",
    targetType: "entity",
    targetId: IDS.elena,
    summary: "Logged HR call notes on Elena Vasquez",
  },
  {
    id: "act12",
    at: daysAgo(5),
    action: "update",
    targetType: "entity",
    targetId: IDS.domainNl,
    summary: "Updated SPF/MX on northline.io",
  },
  {
    id: "act13",
    at: daysAgo(4),
    action: "create",
    targetType: "entity",
    targetId: IDS.elenaDupe,
    summary: 'Imported CRM stub "Elena V. Vasquez"',
  },
  {
    id: "act14",
    at: daysAgo(3),
    action: "update",
    targetType: "case",
    targetId: IDS.caseGlass,
    summary: "Added counsel constraints to case narrative",
  },
  {
    id: "act15",
    at: daysAgo(2),
    action: "update",
    targetType: "entity",
    targetId: IDS.typosquat,
    summary: "Filed Porkbun abuse — ticket PB-88421",
  },
  {
    id: "act16",
    at: daysAgo(1),
    action: "delete",
    targetType: "tool",
    targetId: IDS.toolTrashed,
    summary: "Removed Hunter.io from active tools (license expired)",
  },
  {
    id: "act17",
    at: hoursAgo(8),
    action: "update",
    targetType: "entity",
    targetId: IDS.elena,
    summary: "Snapshot before expanding contact section",
    meta: { snapshot: true },
  },
  {
    id: "act18",
    at: hoursAgo(6),
    action: "update",
    targetType: "entity",
    targetId: IDS.elena,
    summary: "Updated online presence / debunked Acme employment",
  },
];

const savedViews: SavedView[] = [
  {
    id: "sv1",
    name: "People only",
    page: "entities",
    filters: { type: "person" },
    pinned: true,
  },
  {
    id: "sv2",
    name: "Elena Vasquez",
    page: "entities",
    filters: { entityId: IDS.elena },
    pinned: true,
  },
  {
    id: "sv3",
    name: "Operation Glass Desk",
    page: "cases",
    filters: { caseId: IDS.caseGlass },
    pinned: true,
  },
  {
    id: "sv4",
    name: "Active cases",
    page: "cases",
    filters: { status: "active" },
    pinned: false,
  },
  {
    id: "sv5",
    name: "Northline — Glass Desk",
    page: "groups",
    filters: { groupId: IDS.groupNorthline },
    pinned: true,
  },
  {
    id: "sv6",
    name: "OSINT tools",
    page: "tools",
    filters: { tag: "osint" },
    pinned: false,
  },
  {
    id: "sv7",
    name: "Reference resources",
    page: "resources",
    filters: { tag: "reference" },
    pinned: false,
  },
  {
    id: "sv8",
    name: "Pending inbox",
    page: "inbox",
    filters: { status: "pending" },
    pinned: true,
  },
];

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function clearJsonDir(dir: string, keep = false) {
  if (keep) return;
  try {
    const files = await fs.readdir(dir);
    await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map((f) => fs.unlink(path.join(dir, f))),
    );
  } catch {
    /* missing */
  }
}

async function emptyDir(dir: string, keep = false) {
  if (keep) return;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map((e) =>
        fs.rm(path.join(dir, e.name), { recursive: true, force: true }),
      ),
    );
  } catch {
    /* missing */
  }
}

function sha256(data: Buffer | string) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function seedElenaUploads(entity: Entity) {
  const svgPath = path.join(process.cwd(), "public", "file.svg");
  const svgBuf = await fs.readFile(svgPath);
  const attachBody = Buffer.from(
    `Domain Name: NORTHLINE.IO
Registry Domain ID: 2134XXXX-NIC
Registrar: Namecheap, Inc.
Creation Date: 2018-04-12T18:22:11Z
Registry Registrant ID: REDACTED FOR PRIVACY
Registrant Organization: Northline Analytics, Inc.
Name Server: NS1.CLOUDFLARE.COM
Name Server: NS2.CLOUDFLARE.COM

Retrieved: ${daysAgo(4).slice(0, 10)} via WHOISXML
`,
    "utf-8",
  );

  const imgDir = path.join(DATA, "uploads", entity.id, "images");
  const attachDir = path.join(DATA, "uploads", entity.id, "attachments");
  await fs.mkdir(imgDir, { recursive: true });
  await fs.mkdir(attachDir, { recursive: true });

  const imgFilename = "linkedin-headshot-cache.svg";
  const attachFilename = "northline-io-whois-2025-05-17.txt";
  await fs.writeFile(path.join(imgDir, imgFilename), svgBuf);
  await fs.writeFile(path.join(attachDir, attachFilename), attachBody);

  entity.gallery = [
    {
      id: "gi-url",
      source: "url",
      url: "https://media.licdn.com/dms/image/example-profile.jpg",
      caption: "LinkedIn headshot (archived capture, May 2024)",
      folderId: "gf1",
      tags: ["photo", "linkedin"],
      order: 0,
      provenance: {
        confidence: "unsure",
        source: "Wayback Machine",
        collectedAt: daysAgo(45),
      },
    },
    {
      id: "gi-upload",
      source: "upload",
      path: `uploads/${entity.id}/images/${imgFilename}`,
      caption: "Cropped avatar from conference site",
      folderId: "gf1",
      sha256: sha256(svgBuf),
      order: 1,
      provenance: {
        confidence: "inferred",
        source: "BSides SF 2024 speaker page",
        collectedAt: daysAgo(30),
      },
    },
  ];

  entity.attachments = [
    {
      id: "att1",
      filename: attachFilename,
      mimeType: "text/plain",
      path: `uploads/${entity.id}/attachments/${attachFilename}`,
      sha256: sha256(attachBody),
      sizeBytes: attachBody.length,
      caption: "WHOIS pull — northline.io",
      tags: ["whois", "evidence"],
      order: 0,
      uploadedAt: daysAgo(4),
      provenance: { confidence: "sure", collectedAt: daysAgo(4) },
    },
  ];
}

async function seedKitAttachment(entity: Entity) {
  const manifest = Buffer.from(
    JSON.stringify(
      {
        archive: "glass_desk_v2.zip",
        sha256: "a4f2c8e91b7d03e4c1f8820a9b3d5e6f708192ac3d4e5f6a7b8c9d0e1f2a3b4c5d6",
        files: ["login.html", "assets/nl-brand.css", "config.json", "glass_desk_v2.min.js"],
        telegram_bot: "REDACTED — rotated",
        analyst: LEAD,
        collected: daysAgo(9),
      },
      null,
      2,
    ),
    "utf-8",
  );
  const attachDir = path.join(DATA, "uploads", entity.id, "attachments");
  await fs.mkdir(attachDir, { recursive: true });
  const filename = "glass_desk_v2-manifest.json";
  await fs.writeFile(path.join(attachDir, filename), manifest);
  entity.attachments = [
    {
      id: "katt1",
      filename,
      mimeType: "application/json",
      path: `uploads/${entity.id}/attachments/${filename}`,
      sha256: sha256(manifest),
      sizeBytes: manifest.length,
      caption: "IR team manifest — chain of custody email 10 May",
      tags: ["ioc", "sandbox"],
      order: 0,
      uploadedAt: daysAgo(9),
      provenance: { confidence: "sure", source: "Northline IR", collectedAt: daysAgo(9) },
    },
  ];
}

async function seedElenaSnapshot(entity: Entity) {
  const snapshotAt = daysAgo(14).replace(/[:.]/g, "-");
  const snapshot: Entity & { snapshotAt: string; snapshotLabel?: string } = {
    ...entity,
    sections: entity.sections.slice(0, 1),
    gallery: [],
    attachments: [],
    contextEntries: undefined,
    noteEntries: undefined,
    updatedAt: daysAgo(14),
    snapshotAt,
    snapshotLabel: `Pre-HR call profile (${fmtDate(14)}) — ${LEAD}`,
  };
  await writeJson(
    path.join(DATA, "snapshots", entity.id, `${snapshotAt}.json`),
    snapshot,
  );
}

async function seedTrash() {
  const trashDir = path.join(DATA, "trash");
  await fs.mkdir(trashDir, { recursive: true });

  const toolPath = path.join(trashDir, `tool-${IDS.toolTrashed}.json`);
  const playbookPath = path.join(trashDir, `playbook-${IDS.playbookTrashed}.json`);
  await writeJson(toolPath, trashedTool);
  await writeJson(playbookPath, trashedPlaybook);

  const entries: TrashEntry[] = [
    {
      id: IDS.toolTrashed,
      itemType: "tool",
      displayName: trashedTool.name,
      filePath: toolPath,
      deletedAt: daysAgo(1),
    },
    {
      id: IDS.playbookTrashed,
      itemType: "playbook",
      displayName: trashedPlaybook.title,
      filePath: playbookPath,
      deletedAt: daysAgo(2),
    },
  ];
  await writeJson(path.join(trashDir, "index.json"), { entries });
}

async function main() {
  const keep = process.argv.includes("--keep");
  console.log(
    keep
      ? "Loading sample investigation (keeping existing entity/case/group files)…"
      : "Loading sample investigation…",
  );

  await clearJsonDir(path.join(DATA, "entities"), keep);
  await clearJsonDir(path.join(DATA, "cases"), keep);
  await clearJsonDir(path.join(DATA, "groups"), keep);
  await emptyDir(path.join(DATA, "uploads"), keep);
  await emptyDir(path.join(DATA, "snapshots"), keep);
  await emptyDir(path.join(DATA, "trash"), keep);

  const settings = {
    ...DEFAULT_SETTINGS,
    categories: {
      tools: ["Username", "Reference", "Internal", "Graph", "Legacy"],
      resources: ["docs", "reference", "html"],
    },
  };

  const elena = entities.find((e) => e.id === IDS.elena)!;
  const kit = entities.find((e) => e.id === IDS.phishingKit)!;
  await seedElenaUploads(elena);
  await seedKitAttachment(kit);

  await writeJson(path.join(DATA, "settings.json"), settings);
  await writeJson(path.join(DATA, "tools.json"), { tools });
  await writeJson(path.join(DATA, "resources.json"), { resources });
  await writeJson(path.join(DATA, "relationships.json"), { relationships });
  await writeJson(path.join(DATA, "inbox.json"), { items: inbox });
  await writeJson(path.join(DATA, "playbooks.json"), { playbooks });
  await writeJson(path.join(DATA, "activity.json"), { entries: activity });
  await writeJson(path.join(DATA, "saved-views.json"), { views: savedViews });

  for (const entity of entities) {
    await writeJson(path.join(DATA, "entities", `${entity.id}.json`), entity);
  }
  for (const c of [caseGlass, caseArchive, caseClosed]) {
    await writeJson(path.join(DATA, "cases", `${c.id}.json`), c);
  }
  for (const group of groups) {
    await writeJson(path.join(DATA, "groups", `${group.id}.json`), group);
  }

  if (!keep) {
    await seedElenaSnapshot(elena);
    await seedTrash();
  }

  try {
    await fs.unlink(path.join(DATA, "trash.json"));
  } catch {
    /* legacy file */
  }

  console.log("\nDone. Sample investigation loaded:");
  console.log("  Active case: Operation Glass Desk → /cases/" + IDS.caseGlass);
  console.log("  Primary subject: Elena Vasquez → /entities/" + IDS.elena);
  console.log(
    "  Merge test A (Elena CRM dupe) → /entities/" + IDS.elenaDupe,
  );
  console.log(
    "  Merge test B (James Chen vendor) → /entities/" + IDS.jamesDupe,
  );
  console.log(
    "  Same-name homonyms: Marcus Reed (Portland + Austin) → /entities/" +
      IDS.marcusReedA +
      " & " +
      IDS.marcusReedB,
  );
  console.log("  Typosquat host: support-northline.com → /entities/" + IDS.typosquat);
  console.log(
    "  Entities:", entities.length,
    "| Cases: 3 | Groups: 2 | Inbox pending: 3",
  );
  console.log("  Open http://localhost:3000");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
